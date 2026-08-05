#!/usr/bin/env luajit

-- PERF NOTE (deferred 2026-06-05): Per-request HTTP response building does
-- string concatenation in a few spots. LuaJIT's string.buffer (with the FFI
-- reserve/commit path for the body, :put for short headers/glyphs) would let
-- each response be assembled into one growable buffer and flushed via a single
-- C.write — see ~/.claude/CLAUDE.md "LuaJIT Performance" for the canonical
-- idiom. Deferred for now: low-traffic personal site, not a measured
-- bottleneck. Benchmark with `hyperfine -N --warmup 3` before/after.
local socket = require("socket")
local lfs = require("lfs")

local PORT = tonumber(os.getenv("PORT")) or 8080
local SERVER_DIR = os.getenv("SERVER_DIR") or lfs.currentdir()

local MIME_TYPES = {
	html = "text/html; charset=utf-8",
	css = "text/css; charset=utf-8",
	js = "application/javascript; charset=utf-8",
	mjs = "application/javascript; charset=utf-8",
	png = "image/png",
	jpg = "image/jpeg",
	jpeg = "image/jpeg",
}

local CACHE = {}

local function file_exists(path)
	local attr = lfs.attributes(path)
	return attr and attr.mode == "file", attr
end

local function dir_exists(path)
	local attr = lfs.attributes(path)
	return attr and attr.mode == "directory", attr
end

local function read_file(path)
	local fh = assert(io.open(path, "rb"))
	local data = fh:read("*a")
	fh:close()
	return data
end

local function extname(path)
	return path:match("%.([^.]+)$")
end

local function mime_type(path)
	local ext = extname(path)
	return (ext and MIME_TYPES[ext:lower()]) or "application/octet-stream"
end

local function normalize_url_path(url_path)
	url_path = url_path:gsub("%?.*$", "")
	url_path = url_path:gsub("#.*$", "")

	if url_path == "" then
		url_path = "/"
	end

	local parts = {}
	for part in url_path:gmatch("[^/]+") do
		if part == "." or part == "" then
			-- ignore
		elseif part == ".." then
			if #parts > 0 then
				table.remove(parts)
			else
				return nil, "path escapes root"
			end
		else
			parts[#parts + 1] = part
		end
	end

	local normalized = "/" .. table.concat(parts, "/")
	if url_path:sub(-1) == "/" and normalized ~= "/" then
		normalized = normalized .. "/"
	end

	return normalized
end

local function resolve_path(url_path)
	local normalized, err = normalize_url_path(url_path)
	if not normalized then
		return nil, err
	end

	local rel = normalized:sub(2)
	local full = SERVER_DIR
	if rel ~= "" then
		full = SERVER_DIR .. "/" .. rel
	end

	if normalized == "/" or dir_exists(full) then
		if normalized == "/" then
			full = SERVER_DIR
		end
		full = full .. "/index.html"
	end

	local ok = file_exists(full)
	if not ok then
		return nil, "not found"
	end

	return full
end

local function cached_file(path)
	local attr = lfs.attributes(path)
	if not attr or attr.mode ~= "file" then
		return nil
	end

	local mtime = attr.modification
	local entry = CACHE[path]

	if entry and entry.mtime == mtime then
		return entry
	end

	local body = read_file(path)
	entry = {
		mtime = mtime,
		body = body,
		content_length = #body,
		content_type = mime_type(path),
	}
	CACHE[path] = entry
	return entry
end

local function send_response(client, status, reason, headers, body)
	body = body or ""
	headers = headers or {}

	local lines = {
		("HTTP/1.1 %d %s\r\n"):format(status, reason),
	}

	if not headers["Content-Length"] then
		headers["Content-Length"] = #body
	end
	if not headers["Connection"] then
		headers["Connection"] = "close"
	end

	for k, v in pairs(headers) do
		lines[#lines + 1] = ("%s: %s\r\n"):format(k, v)
	end
	lines[#lines + 1] = "\r\n"

	client:send(table.concat(lines))
	if #body > 0 then
		client:send(body)
	end
end

local function handle_client(client)
	client:settimeout(1)

	local request_line = client:receive("*l")
	if not request_line then
		client:close()
		return
	end

	local method, target = request_line:match("^(%S+)%s+(%S+)%s+HTTP/%d%.%d$")
	if not method or not target then
		send_response(client, 400, "Bad Request", {
			["Content-Type"] = "text/plain; charset=utf-8",
		}, "bad request\n")
		client:close()
		return
	end

	while true do
		local line = client:receive("*l")
		if not line or line == "" then
			break
		end
	end

	if method ~= "GET" and method ~= "HEAD" then
		send_response(client, 405, "Method Not Allowed", {
			["Content-Type"] = "text/plain; charset=utf-8",
			["Allow"] = "GET, HEAD",
		}, "method not allowed\n")
		client:close()
		return
	end

	local path, err = resolve_path(target)
	if not path then
		local status = (err == "path escapes root") and 403 or 404
		local reason = (status == 403) and "Forbidden" or "Not Found"
		send_response(client, status, reason, {
			["Content-Type"] = "text/plain; charset=utf-8",
		}, reason:lower() .. "\n")
		client:close()
		return
	end

	local entry = cached_file(path)
	if not entry then
		send_response(client, 500, "Internal Server Error", {
			["Content-Type"] = "text/plain; charset=utf-8",
		}, "internal error\n")
		client:close()
		return
	end

	send_response(client, 200, "OK", {
		["Content-Type"] = entry.content_type,
		["Content-Length"] = entry.content_length,
	}, method == "HEAD" and "" or entry.body)

	client:close()
end

local server = assert(socket.bind("*", PORT))
print(("Serving %s on http://127.0.0.1:%d"):format(SERVER_DIR, PORT))

while true do
	local client = server:accept()
	if client then
		handle_client(client)
	end
end
