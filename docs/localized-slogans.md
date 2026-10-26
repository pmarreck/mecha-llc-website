# Compact localized slogans

Reviewed: 2026-10-26. The visible label is an abbreviation or compact native form;
the tooltip supplies the fuller meaning. A full multiword idiom as the button
label misses this intended reveal. English GSD and the owner-approved German SEK
remain unchanged. Both Chinese editions use 搞定.

Initialisms may be coined for this site. They are not represented as conventional
abbreviations in their languages. Native-script shortcuts need not imitate Latin
initials. Connect the heading grammatically around the expanded idea, and keep
the tone mildly cheeky rather than shocking. The German tooltip is explicitly
approved by a fluent speaker; that approval does not certify other locales.

The revised candidates received separate, source-aware AI review of initials,
expansions, grammar and tone. This is not native-speaker certification. Existing
selective notices remain only for Amharic, Hausa, Igbo, Pashto and Yoruba, per
the publication policy in RULES.md. Other locales display normally.

## Reviewed labels and reveal text

| Locale | Compact label | Tooltip | Form |
|---|---|---|---|
| am | ጨርስ | ሥራውን ጨርስ፣ በእርግጥ። | shortcut |
| ar | إنجاز | إنجاز الشغل، طبعًا. | shortcut |
| az | İB | İş bitirmək, əlbəttə. | initialism |
| bg | СР | Свършена работа, разбира се. | initialism |
| bn | সারো | কাজ সেরে ফেলার জন্য, অবশ্যই! | shortcut |
| bs | ZP | Završavanje posla, naravno. | initialism |
| da | FDG | Få det gjort, selvfølgelig. | initialism |
| de | SEK | Scheiß erledigt kriegen, natürlich. | initialism |
| el | ΓΔ | Γίνεται δουλειά, φυσικά. | initialism |
| en | GSD | Getting stuff done, of course. | initialism |
| es | AL | Al lío: manos a la obra y trabajo hecho, claro. | initialism |
| fa | ردیف | یعنی کارها رو ردیف کنیم، معلومه! | shortcut |
| fi | HM | Hommat maaliin, totta kai. | initialism |
| fil | TK | Trabahong kumpleto, siyempre! | initialism |
| fr | ADB | Abattre du boulot, pas brasser de l’air. Évidemment. | initialism |
| ha | KA | Kammala aiki, mana. | initialism |
| he | תקתק | לתקתק עניינים, ברור. | shortcut |
| hi | निपटाओ | काम निपटाने के लिए, ज़ाहिर है! | shortcut |
| hr | OP | Obavljanje posla, naravno. | initialism |
| hu | DI | Dolgok intézése, naná! | initialism |
| id | BK | Beresin kerjaan, tentu saja. | initialism |
| ig | ỊỌ | Ịrụ ọrụ, n’ezie. | initialism |
| is | KD | Klára dæmið, auðvitað. | initialism |
| it | AS | Al sodo: andare al sodo e portare a casa il risultato, ovviamente. | initialism |
| ja | 片付け | やることをさっさと片付ける。もちろん。 | shortcut |
| km | ចប់ | បញ្ចប់ការងារ ពិតណាស់! | shortcut |
| ko | 뚝딱 | 할 일을 뚝딱 해치우자는 거죠. 물론이죠! | shortcut |
| mk | ЗР | Завршена работа, се разбира. | initialism |
| nb | FTG | Få ting gjort, selvfølgelig. | initialism |
| nl | DBA | De boel aanpakken en afmaken, natuurlijk. | initialism |
| pa | ਨਿਬੇੜੋ | ਕੰਮ ਨਿਬੇੜਨ ਲਈ, ਬੇਸ਼ੱਕ। | shortcut |
| pl | DR | Do roboty, oczywiście. | initialism |
| ps | کار | د کارونو د ترسره کولو لپاره، البته. | shortcut |
| pt_br | FA | Fazer acontecer, claro. | initialism |
| ro | TF | Treabă făcută, bineînțeles. | initialism |
| ru | ДДК | Довести дело до конца, конечно. | initialism |
| sl | OD | Opravljanje dela, seveda. | initialism |
| sq | KP | Kryerjen e punës, sigurisht. | initialism |
| sr | ЗП | Завршавање посла, наравно. | initialism |
| sv | FDG | Få det gjort, såklart. | initialism |
| sw | KK | Kumaliza kazi, bila shaka. | initialism |
| ta | முடிப்போம் | வேலைகளை முடிப்போம், நிச்சயமாக. | shortcut |
| th | ลุย | ลุยงานให้เสร็จสิ แน่นอน! | shortcut |
| tr | İB | İş bitiren araçlar, tabii ki. | initialism |
| uk | ДСК | Довести справу до кінця, звісно. | initialism |
| ur | نمٹاؤ | کام نمٹانے کے لیے، ظاہر ہے! | shortcut |
| vi | XG | Xử gọn công việc, tất nhiên rồi. | initialism |
| yo | ṢI | Ṣíṣe iṣẹ́, dájúdájú. | initialism |
| zh_hans | 搞定 | 把事情搞定，当然啦！ | shortcut |
| zh_hant | 搞定 | 把事情搞定，當然囉。 | shortcut |

## Regression contract

Catalogs remain the production source. The reviewed pairs and heading fragments
are recorded in `tests/fixtures/slogan-contract.json`. Tests check every locale
against that record, require a shorter label than its expansion, and enforce the
current six-grapheme, no-whitespace label budget. Graphemes avoid treating a
combining mark as a separate visible letter. Layout still needs browser checks;
equal grapheme counts do not imply equal pixel widths.

When intentionally revising copy, review the new short form and its expansion,
then update the catalog and review fixture together. Do not change the fixture
merely to bless an accidentally expanded label. Previous longer phrases remain
recoverable in Git history.
