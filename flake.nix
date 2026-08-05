{
	description = "Mecha LLC static website and checkout contract";

	inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

	outputs = { nixpkgs, ... }:
		let
			systems = [ "x86_64-linux" "aarch64-linux" "aarch64-darwin" ];
			forAllSystems = function:
				nixpkgs.lib.genAttrs systems (system: function (import nixpkgs { inherit system; }));
			cleanSource = pkgs: pkgs.lib.cleanSourceWith {
				src = ./.;
				filter = path: type:
					let name = baseNameOf path;
					in name != ".git" && name != "inbox" && name != "PLAN.md" && name != "node_modules";
			};
			luaFor = pkgs: pkgs.luajit.withPackages (packages: [ packages.luasocket packages.luafilesystem ]);
		in {
			packages = forAllSystems (pkgs: {
				default = pkgs.stdenvNoCC.mkDerivation {
					pname = "mecha-llc-website";
					version = "0.1.0";
					src = cleanSource pkgs;
					nativeBuildInputs = [ pkgs.bash pkgs.nodejs_24 pkgs.ripgrep (luaFor pkgs) ];
					buildPhase = ''
						runHook preBuild
						patchShebangs .
						./build
						runHook postBuild
					'';
					installPhase = ''
						mkdir -p "$out/share/mecha-llc-website"
						cp -R CNAME index.html assets consulting contact legal software thoughts work "$out/share/mecha-llc-website/"
					'';
				};
			});

			checks = forAllSystems (pkgs: {
				test = pkgs.stdenvNoCC.mkDerivation {
					pname = "mecha-llc-website-tests";
					version = "0.1.0";
					src = cleanSource pkgs;
					nativeBuildInputs = [
						pkgs.bash pkgs.coreutils pkgs.curl pkgs.git pkgs.gnugrep pkgs.nodejs_24
						pkgs.perl pkgs.ripgrep (luaFor pkgs)
					];
					buildPhase = ''
						runHook preBuild
						patchShebangs .
						./test
						runHook postBuild
					'';
					installPhase = ''
						mkdir -p "$out"
						printf 'tests passed\n' > "$out/result"
					'';
				};
			});

			devShells = forAllSystems (pkgs: {
				default = pkgs.mkShell {
					packages = [ pkgs.nodejs_24 pkgs.ripgrep (luaFor pkgs) ];
				};
			});
		};
}
