/**
 * Comprehensive disposable / temporary / throwaway email domain blocklist.
 * Covers major services: TempMail, Mailinator, Guerrilla Mail, 10MinuteMail,
 * YopMail, Trashmail, Discard.email, Sharklasers and hundreds more.
 *
 * Last updated: 2026-04-17
 */

export const DISPOSABLE_EMAIL_DOMAINS = new Set([
  // ── TempMail / temp-mail.org rotating domain pool ──
  "mypethealh.com",
  "armyspy.com",
  "cuvox.de",
  "dayrep.com",
  "einrot.com",
  "fleckens.hu",
  "gustr.com",
  "jourrapide.com",
  "rhyta.com",
  "superrito.com",
  "teleworm.us",
  "temp-mail.org",
  "temp-mail.ru",
  "tempemail.com",
  "tempemail.net",
  "tempemail.co",
  "tempinbox.com",
  "tempinbox.co.uk",
  "tempr.email",
  "tempremail.com",
  "tmpmail.net",
  "tmpmail.org",
  "tmpnator.live",
  "discard.email",
  "discardmail.com",
  "discardmail.de",
  "spamgourmet.com",
  "spamgourmet.net",
  "spamgourmet.org",

  // ── Mailinator ──
  "mailinator.com",
  "mailinator2.com",
  "mailinator.net",
  "mailinator.org",
  "mailinater.com",
  "mailnull.com",

  // ── 10 Minute Mail ──
  "10minutemail.com",
  "10minutemail.net",
  "10minutemail.co.uk",
  "10minutemail.de",
  "10minutemail.eu",
  "10minutemail.info",
  "10minutemail.org",
  "10minutemail.ru",
  "10minutemail.us",
  "10minutemail.be",
  "10minutemail.cf",
  "10minutemail.ga",
  "10minutemail.gq",
  "10minutemail.ml",
  "10minutemail.tk",
  "10minutesmailbox.com",
  "10minutetempemail.com",
  "10minemail.com",
  "my10minutemail.com",
  "minutemailbox.com",

  // ── YopMail ──
  "yopmail.com",
  "yopmail.fr",
  "yopmail.net",
  "yopmail.pp.ua",
  "cool.fr.nf",
  "jetable.fr.nf",
  "nospam.ze.tc",
  "nomail.xl.cx",
  "mega.zik.dj",
  "speed.1s.fr",
  "courriel.fr.nf",
  "moncourrier.fr.nf",
  "monemail.fr.nf",
  "monmail.fr.nf",
  "brefmail.com",
  "speed.1s.fr",

  // ── Guerrilla Mail ──
  "guerrillamail.com",
  "guerrillamail.biz",
  "guerrillamail.de",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamail.info",
  "guerrillamailblock.com",
  "grr.la",
  "spam4.me",
  "sharklasers.com",
  "guerrillamailblock.com",
  "guerrillamail.co",
  "spam4.me",

  // ── Trashmail ──
  "trashmail.com",
  "trashmail.at",
  "trashmail.io",
  "trashmail.me",
  "trashmail.net",
  "trashmail.org",
  "trashmail.xyz",
  "trashmailer.com",
  "trash-mail.at",
  "trash-mail.com",
  "trashinbox.com",
  "trashdevil.com",
  "trashdevil.de",

  // ── Throwaway / Disposable ──
  "throwam.com",
  "throwawaymail.com",
  "throwam.com",
  "throwam.com",
  "spamthisplease.com",
  "spamfree24.org",
  "spamfree24.de",
  "spamfree24.eu",
  "spamfree24.info",
  "spamfree24.net",
  "spamfree24.com",
  "antispam24.de",
  "ano-mail.net",
  "anonaddy.com",
  "anon-mail.de",
  "anonbox.net",
  "anonymail.dk",
  "anonymousmail.com",
  "anonymstermail.com",

  // ── Fake / Junk ──
  "fakeinbox.com",
  "fakeinbox.cf",
  "fakeinbox.ga",
  "fakeinbox.info",
  "fakeinbox.ml",
  "fakeinbox.tk",
  "fakeinformation.com",
  "fakedomain.com",
  "fakermail.com",
  "fakemail.fr",
  "fakemail.net",
  "fakemail.com",

  // ── Dispostable / Disposable ──
  "dispostable.com",
  "disposableaddress.com",
  "disposable.cf",
  "disposable.ga",
  "disposable.ml",
  "disposableemailaddresses.com",
  "disposablemails.com",
  "disposeamail.com",

  // ── GetnAda / Nada ──
  "getnada.com",
  "nada.email",
  "nadaemail.com",

  // ── Maildrop ──
  "maildrop.cc",
  "maildrop.cf",
  "maildrop.ga",
  "maildrop.gq",
  "maildrop.ml",

  // ── Mailnesia ──
  "mailnesia.com",
  "mailnesia.net",
  "mailnull.com",
  "mailscrap.com",
  "mailseal.de",
  "mailshiv.com",
  "mailslapping.com",
  "mailslite.com",
  "mailsoul.com",
  "mailtome.de",
  "mailzi.com",

  // ── Spam / Junk catchalls ──
  "inboxclean.com",
  "inboxclean.org",
  "inboxproject.com",
  "irabops.com",
  "spamwc.de",
  "spamwc.ga",
  "spamwc.gq",
  "spamwc.ml",
  "spamwc.tk",
  "spamwc.cf",
  "spamspot.com",
  "spammotel.com",
  "spammotel.mobi",
  "spamhereplease.com",
  "spamhereplease.info",

  // ── Temp / burner email services ──
  "tempail.com",
  "tempalias.com",
  "tempinbox.com",
  "temp-mail.com",
  "tempmail.com",
  "tempmail.de",
  "tempmail.eu",
  "tempmail.it",
  "tempmail.net",
  "tempmail.pro",
  "tempmail.us",
  "tempmail.ws",
  "tempmail2.com",
  "tempmailaddress.com",
  "temporarymail.com",
  "temporary-mail.net",
  "temporaryemail.com",
  "temporaryemail.net",
  "temporaryforwarding.com",
  "tempsky.com",
  "tempymail.com",

  // ── Mohmal / Arab spam services ──
  "mohmal.com",
  "mohmal.im",
  "mohmal.tech",

  // ── Mailtemp / Quick Mail ──
  "mailtemp.info",
  "mailtemp.net",
  "mailtemp.co.uk",
  "quickmail.in",
  "quickinbox.com",
  "quickemail.info",

  // ── BurnerMail ──
  "burnermail.io",

  // ── Spamgoblin ──
  "spamgoblin.com",
  "spamgoblin.net",

  // ── GetairMail / AirMail ──
  "getairmail.com",
  "airmail.com",

  // ── Throwam / Throwbin ──
  "throwbin.io",

  // ── Sleepy time ──
  "sleepingmail.com",
  "coolsleepingpads.com",
  "slippery.email",

  // ── Dropmail ──
  "dropmail.me",
  "droplister.com",

  // ── Mailpoof ──
  "mailpoof.com",

  // ── Harakirimail ──
  "harakirimail.com",

  // ── Dodgeit ──
  "dodgeit.com",
  "dodgemail.de",

  // ── Mailexpire ──
  "mailexpire.com",

  // ── KillMail ──
  "killmail.com",
  "killmail.net",
  "killmail.org",

  // ── Spamfree ──
  "spamfree.eu",
  "spamfree24.org",

  // ── Mailbucket ──
  "mailbucket.org",

  // ── Mintemail ──
  "mintemail.com",

  // ── Jetable ──
  "jetable.com",
  "jetable.fr",
  "jetable.net",
  "jetable.org",
  "jetable.pp.ua",
  "jetable.ru",

  // ── MailNull ──
  "mailnull.com",

  // ── Noclickemail ──
  "noclickemail.com",

  // ── Sofort-mail ──
  "sofort-mail.de",

  // ── Deagelo ──
  "deagelo.com",

  // ── Deadaddress ──
  "deadaddress.com",

  // ── Dontreg ──
  "dontreg.com",

  // ── Dontsendmespam ──
  "dontsendmespam.de",

  // ── Emailtemporario ──
  "emailtemporario.com.br",

  // ── EmailFake ──
  "emailfake.com",
  "emailfake.ml",
  "emailfake.cf",
  "emailfake.ga",
  "emailfake.gq",
  "emailfake.tk",
  "emailfakeservice.com",

  // ── Emailias ──
  "emailias.com",

  // ── Email60 ──
  "email60.com",

  // ── Emailsensei ──
  "emailsensei.com",

  // ── Mailforspam ──
  "mailforspam.com",

  // ── Laoeq ──
  "laoeq.com",

  // ── Linkuv ──
  "linkuv.com",

  // ── Lol.ovpn.to ──
  "lol.ovpn.to",

  // ── Instant-mail ──
  "instant-mail.de",

  // ── Mega.coiffure ──
  "mega.coiffure",

  // ── Mailox ──
  "mailox.biz",
  "mailox.fun",

  // ── Notmail ──
  "notmail.net",
  "notmail.org",
  "notmail.com",

  // ── Nowmymail ──
  "nowmymail.com",

  // ── Nowmymail ──
  "nurfuerspam.de",

  // ── Oneoffmail ──
  "oneoffmail.com",

  // ── Opentrash ──
  "opentrash.com",

  // ── Pjjkp ──
  "pjjkp.com",

  // ── Pokemail ──
  "pokemail.net",

  // ── Postacı ──
  "postacı.com",

  // ── Primail ──
  "primail.ru",

  // ── Proxymail ──
  "proxymail.eu",

  // ── Punkass ──
  "punkass.com",

  // ── Putthisinyourspamdatabase ──
  "putthisinyourspamdatabase.com",

  // ── Recode.me ──
  "recode.me",

  // ── Rego.ee ──
  "rego.ee",

  // ── Safetymail ──
  "safetymail.info",

  // ── Sandelf ──
  "sandelf.de",

  // ── Scatmail ──
  "scatmail.com",

  // ── SendSpamHere ──
  "sendspamhere.com",

  // ── Shieldemail ──
  "shieldemail.com",

  // ── Shortmail ──
  "shortmail.net",

  // ── Sify ──
  "sify.com",

  // ── Snkmail ──
  "snkmail.com",

  // ── SofiaMail ──
  "sofiamail.com",

  // ── Spamcon ──
  "spam.la",
  "spamcon.org",

  // ── Tempinbox ──
  "mailexpire.com",

  // ── Throttlemail ──
  "throttlemail.com",

  // ── ThrowAM ──
  "throwam.com",

  // ── Trsh.to ──
  "trsh.to",

  // ── TwentyMinutemail ──
  "twenty-minute-mail.com",
  "twentyminmail.com",

  // ── Uggsrock ──
  "uggsrock.com",

  // ── Uroid ──
  "uroid.com",

  // ── Vomoto ──
  "vomoto.com",

  // ── WastedTime ──
  "wastedtime.net",

  // ── WhoMail ──
  "whomail.net",

  // ── Yapped ──
  "yapped.net",

  // ── YYouporn ──
  "yuurok.com",

  // ── Zehnminutenmail ──
  "zehnminutenmail.de",

  // ── Zip.net ──
  "zip.net",

  // ── 1-hour mail ──
  "1-hour.email",
  "1hourmail.com",
  "1hourmail.net",
  "1hourmail.org",
  "1hourmail.uk",

  // ── 20minutemail ──
  "20minutemail.com",
  "20minutemail.it",
  "20minutemail.net",
  "20minutemail.us",
  "20mail.eu",
  "20mail.in",
  "20mail.it",

  // ── 33mail (alias service) ──
  "33mail.com",

  // ── 4warding ──
  "4warding.com",
  "4warding.net",
  "4warding.org",

  // ── Abyssmail ──
  "abyssmail.com",

  // ── Acentri ──
  "acentri.com",

  // ── Acg-tg ──
  "acg-tg.ru",

  // ── AdGuard ──
  "adguard.com",

  // ── Amail ──
  "amail.com",
  "amail4.me",

  // ── Antispam ──
  "antispam.de",

  // ── Beefmilk ──
  "beefmilk.com",

  // ── Bobmail ──
  "bobmail.info",

  // ── Bodhi.lawlita ──
  "bodhi.lawlita.com",

  // ── Bouncr ──
  "bouncr.com",

  // ── Breakthru ──
  "breakthru.com",

  // ── Bumpymail ──
  "bumpymail.com",

  // ── Cellurl ──
  "cellurl.com",

  // ── Centermail ──
  "centermail.com",
  "centermail.net",

  // ── Chong-mail ──
  "chong-mail.com",
  "chong-mail.net",
  "chong-mail.org",

  // ── Classicalfan ──
  "classicalfan.com",

  // ── Clixser ──
  "clixser.com",

  // ── Conemail ──
  "comsafe-mail.net",
  "conemail.ru",

  // ── CorreoChiapas ──
  "correochimex.com",

  // ── Courriel ──
  "courrieltemporaire.com",

  // ── Cubiclink ──
  "cubiclink.com",

  // ── Curryworld ──
  "curryworld.de",

  // ── Daggle ──
  "daggle.com",

  // ── dancemail ──
  "dancemail.net",

  // ── Deadletter ──
  "deadletter.ga",
  "deadletter.tk",
  "deadletter.ml",
  "deadletter.cf",
  "deadletter.gq",

  // ── Deathstar ──
  "deathstar.jp",

  // ── Dependingo ──
  "dependingo.com",

  // ── Despam ──
  "despam.it",

  // ── Dev-null ──
  "dev-null.cf",

  // ── DirectMail ──
  "dfgh.net",

  // ── Digitalsanctuary ──
  "digitalsanctuary.com",

  // ── Dingbone ──
  "dingbone.com",

  // ── Disposedmail ──
  "disposeamail.com",

  // ── Dm.w3internet ──
  "dm.w3internet.co.uk",

  // ── Domforfb ──
  "domforfb1.tk",
  "domforfb2.tk",
  "domforfb3.tk",
  "domforfb4.tk",
  "domforfb5.tk",

  // ── Dontsendmespam ──
  "dontsendmespam.de",

  // ── Drdrb ──
  "drdrb.com",
  "drdrb.net",

  // ── Dumpandfuck ──
  "dumpandfuck.com",

  // ── DumpEmail ──
  "dumpmail.de",
  "dumpinbox.com",

  // ── E-mail.org ──
  "e-mail.org",

  // ── EasyTrashmail ──
  "easytrashmail.com",

  // ── Elearningjournal ──
  "elearningjournal.com",

  // ── EmailAIO ──
  "emailaio.com",

  // ── Emaildienst ──
  "emaildienst.de",

  // ── Emailforyou ──
  "emailforyou.net",

  // ── Emailhelpdesk ──
  "emailhelpdesk.com",

  // ── Emailigo ──
  "emailigo.de",

  // ── Emailite ──
  "emailite.com",

  // ── Emailmiser ──
  "emailmiser.com",

  // ── Emailspam ──
  "emailspam.cf",
  "emailspam.ga",
  "emailspam.ml",
  "emailspam.tk",
  "emailspam.gq",

  // ── Emailwarden ──
  "emailwarden.com",

  // ── Emailx ──
  "emailx.at.hm",

  // ── Emkei ──
  "emkei.cz",
  "emkei.ga",
  "emkei.gq",
  "emkei.ml",
  "emkei.tk",
  "emkei.cf",

  // ── Enterto ──
  "enterto.com",

  // ── Ephemail ──
  "ephemail.net",

  // ── Etranquil ──
  "etranquil.com",
  "etranquil.net",
  "etranquil.org",

  // ── EUmail ──
  "eumail.com",

  // ── Explodemail ──
  "explodemail.com",
  "explodemail.net",

  // ── Extremail ──
  "extremail.ru",

  // ── EZmail ──
  "ezmailer.net",

  // ── F4k ──
  "f4k.es",

  // ── Fakedemail ──
  "fakedemail.com",

  // ── FakeEmail ──
  "fakemae.com",

  // ── Fightallspam ──
  "fightallspam.com",

  // ── Filzmail ──
  "filzmail.com",

  // ── FlexyAlias ──
  "firemailbox.club",

  // ── flyspam ──
  "flyspam.com",

  // ── ForExEmail ──
  "forexemplo.com",

  // ── ForgetItMail ──
  "forgetmail.com",

  // ── Freundin ──
  "freundin.ru",

  // ── FromDustbin ──
  "fromdust.bin.com",

  // ── Fuwamofu ──
  "fuwamofu.com",

  // ── Galaxy ──
  "galaxymail.org",

  // ── Garbagemail ──
  "garbagemail.org",

  // ── Garyes ──
  "garyes.com",

  // ── Gedmail ──
  "gedmail.win",

  // ── Gelitik ──
  "gelitik.in",

  // ── GetOnemail ──
  "getonemail.com",
  "getonemail.net",

  // ── Ghostmail ──
  "ghostmail.com",
  "ghostmail.net",

  // ── Girlsundertheinfluence ──
  "girlsundertheinfluence.com",

  // ── GmailnEW ──
  "gmailnew.com",

  // ── Goat.net ──
  "goat.si",

  // ── Goldmail ──
  "goldmail.ru",

  // ── Gowikibooks ──
  "gowikibooks.com",
  "gowikicampus.com",
  "gowikicars.com",
  "gowikifilms.com",
  "gowikigames.com",
  "gowikimusic.com",
  "gowikinetwork.com",
  "gowikitravel.com",
  "gowikitv.com",

  // ── Greensloth ──
  "greensloth.com",

  // ── Haltospam ──
  "haltospam.com",

  // ── Hatespam ──
  "hatespam.org",

  // ── Heil-rechts ──
  "heil-rechts.de",

  // ── Hezll ──
  "hezll.com",

  // ── Hidezz ──
  "hidezz.com",

  // ── Hidzz ──
  "hidzz.com",

  // ── HisoMail ──
  "hisomail.com",

  // ── Hotpop ──
  "hotpop.com",

  // ── TempMail popular service domains ──
  "bobmail.info",
  "chammy.info",
  "devnullmail.com",
  "fightallspam.com",
  "imstations.com",
  "jetable.net",
  "kant.li",
  "krovatka.su",
  "kurzepost.de",
  "lackmail.net",
  "legitmail.org",
  "lhsdv.com",
  "ll47.net",
  "lol.ovpn.to",
  "lortemail.dk",
  "losemymail.com",
  "lovemeleaveme.com",
  "lukemail.info",
  "lukop.dk",
  "m21.cc",
  "maik.de",
  "mail-filter.com",
  "mail-temporaire.com",
  "mail-temporaire.fr",
  "mail.mezimages.net",
  "mail2rss.org",
  "mail333.com",
  "mailandftp.com",
  "mailbidon.com",
  "mailblocks.com",
  "mailc.net",
  "mailcat.biz",
  "mailcatch.com",
  "mailde.de",
  "mailde.info",
  "maildrop.cc",
  "maileimer.de",
  "mailezee.com",
  "mailf5.com",
  "mailfall.com",
  "mailfreeonline.com",
  "mailfsgs.com",
  "mailguard.me",
  "mailhazard.com",
  "mailhazard.us",
  "mailimate.com",
  "mailin8r.com",
  "mailinatar.com",
  "mailinater.com",
  "mailing.one",
  "mailingwire.com",
  "mailismagic.com",
  "mailme.ir",
  "mailme.lv",
  "mailme24.com",
  "mailmetrash.com",
  "mailmirage.com",
  "mailmoat.com",
  "mailms.com",
  "mailnew.com",
  "mailninja.co.uk",
  "mailnx.com",
  "mailod.com",
  "mailorc.com",
  "mailorg.ga",
  "mailorganic.com",
  "mailpick.biz",
  "mailproxsy.com",
  "mailquack.com",
  "mailrock.biz",
  "mailroi.com",
  "mailseal.de",
  "mailsentent.com",
  "mailshell.com",
  "mailsiphon.com",
  "mailslapping.com",
  "mailslite.com",
  "mailsnare.net",
  "mailspam.me",
  "mailspam.xyz",
  "mailstart.com",
  "mailsucker.net",
  "mailtechx.com",
  "mailtemporaire.com",
  "mailtemporaire.fr",
  "mailtobc.com",
  "mailtome.de",
  "mailtothis.com",
  "mailtrack.com",
  "mailtrix.net",
  "mailuck.com",
  "mailvault.com",
  "mailw.info",
  "mailwire.com",
  "mailwork.com",
  "mailzilla.com",
  "mailzilla.org",
  "makemefoot.pw",
  "malahov.de",
  "manifestgoo.com",
  "manybrain.com",
  "mbx.cc",
  "mciek.com",
  "medicineoffer.com",
  "mega.zik.dj",
  "megamail.pt",
  "meinspamschutz.de",
  "meltmail.com",
  "messagebeamer.de",
  "mezimages.net",
  "mierdamail.com",
  "migmail.net",
  "migmail.pl",
  "migumail.com",
  "mindspring.com",
  "ministryofnoise.de",
  "miriamschwartz.com",
  "misterpinball.de",
  "mjukglass.nu",
  "mnetgold.com",
  "moimoi.re",
  "moncourrier.fr.nf",
  "monemail.fr.nf",
  "monmail.fr.nf",
  "morriesworld.ml",
  "motique.de",
  "mountainregionallibrary.net",
  "movemail.com",
  "msft.cloudns.asia",
  "mt2009.com",
  "mt2014.com",
  "mx0.wwwnew.eu",
  "myfastmail.com",
  "mymail-in.net",
  "myprivacy.dk",
  "myspamless.com",
  "mytemp.email",
  "mytempemail.com",
  "mytempmail.com",
  "mytrashmail.com",
  "nabuma.com",
  "nakedtruth.biz",
  "nametc.com",
  "netmails.com",
  "netmails.net",
  "netzidiot.de",
  "nicknassar.com",
  "nincsmail.hu",
  "nmail.cf",
  "nnot.net",
  "no-spam.ws",
  "nobulk.com",
  "noclickemail.com",
  "nodezine.com",
  "nogmailspam.info",
  "nomail.pw",
  "nomail.xl.cx",
  "nomail2me.com",
  "nopist.com",
  "norih.com",
  "notmail.net",
  "notmail.org",
  "nowmymail.com",
  "ntlhelp.net",
  "nullbox.info",
  "nurfuerspam.de",
  "nwytg.com",
  "nwytg.net",

  // ── one-click mail services ──
  "one-time.email",
  "onewaymail.com",
  "oopi.org",
  "ordinaryamerican.net",
  "out-law.com",
  "owleyes.ch",
  "ownsyou.de",

  // ── poopmails ──
  "poopatella.de",
  "pookmail.com",

  // Extra common ones
  "spamgrid.com",
  "spaml.de",
  "spaml.com",
  "spamoff.de",
  "spamtrap.ro",
  "spamwc.cf",
  "spamwc.de",
  "spamwc.ga",
  "spamwc.gq",
  "spamwc.ml",
  "spamwc.tk",
  "spoofmail.de",
  "squizzy.de",
  "squizzy.eu",
  "squizzy.net",
  "ssl.tls.cloudns.asia",
  "stereobucket.com",
  "stinkefinger.net",
  "stoptabac.com",
  "suremail.info",
  "svk.jp",
  "sweetxxx.de",

  // ── TempMail rotating pools ──
  "flockhook.net",
  "kzccv.com",
  "kurzepost.de",
  "rppkn.com",
  "spacemail.com",
  "qibl.at",
  "quickinbox.com",
  "rezai.com",
  "rgphotos.net",
  "rk9.chickenkiller.com",
  "rklips.com",
  "rmqkr.net",
  "rootfest.net",
  "rppkn.com",
  "rq6.chickenkiller.com",
  "s0ny.net",
  "safe-mail.net",
  "safetypost.de",
  "sags-per-mail.de",
  "saharanightsarab.com",
  "sandelf.de",
  "sast.ro",
  "schlumpfland.de",
  "securemail.tk",
  "secretasians.com",
  "selfdestructingmail.com",
  "selfdestructingmail.org",
  "sendspamhere.com",
  "senseless-entertainment.com",
  "services391.com",
  "seven-nexa.com",
  "sfamo.com",
  "shadowmail.de",
  "shieldedmail.com",
  "shitmail.me",
  "shitmail.org",
  "shitware.nl",
  "shoproyal.net",
  "shortmail.net",
  "sibmail.com",
  "smailpro.com",
  "snakemail.com",
  "sneakemail.com",
  "snkmail.com",
  "sofimail.com",
  "sofort-mail.de",
  "solfanelli.it",
  "solids.dk",
  "soodo.com",
  "spamail.de",
  "spamarrest.com",
  "spamavert.com",
  "spambox.info",
  "spambox.irishspringrealty.com",
  "spambox.us",
  "spamcero.com",
  "spamcon.org",
  "spamday.com",
  "spamdecoy.net",
  "spamex.com",
  "spamfree.eu",
  "spamfree24.com",
  "spamfree24.de",
  "spamfree24.eu",
  "spamfree24.info",
  "spamfree24.net",
  "spamfree24.org",
  "spamgoes.in",
  "spamgourmet.com",
  "spamgourmet.net",
  "spamgourmet.org",
  "spamherelots.com",
  "spamhereplease.com",
  "spamhole.com",
  "spamify.com",
  "spaminator.de",

  // ── Wegwerfmail ──
  "wegwerfmail.de",
  "wegwerfmail.net",
  "wegwerfmail.org",
  "wegwerfemail.de",
  "wegwerfemail.com",
  "wetrainbayarea.org",
  "willhackforfood.biz",
  "willselfdestruct.com",
  "winemaven.info",
  "wmail.cf",
  "wob.de",
  "write-me.in",

  // ── Xemphimhd ──
  "xemphimhd.com",
  "xmastime.com",

  // ── Yam.com ──
  "yam.com",

  // ── Yapped ──
  "yapped.net",

  // ── YnFmail ──
  "ynfmail.tk",

  // ── Yopmail variants ──
  "yopmail.info",
  "yopmail.pp.ua",

  // ── Yourspam ──
  "yourspam.eu",

  // ── Yuurok ──
  "yuurok.com",

  // ── zehnminuten ──
  "zehnminuten.de",
  "zehnminutenmail.de",
  "zippymail.info",
  "zoaxe.com",
  "zoemail.net",
  "zoemail.org",
  "zomg.info",
  "anotherdomaincreated.com",

  // ── Additional TempMail.org domains found in the wild ──
  "mypethealh.com",
  "flockhook.net",
  "kzccv.com",
  "qibl.at",
  "rezai.com",
  "spacemail.com",
  "norih.com",
  "nwytg.com",
  "nwytg.net",
  "mt2014.com",
  "nabuma.com",
  "mb69.com",
  "kurzepost.de",
  "rppkn.com",
  "donemail.ru",
  "cool.fr.nf",
  "dz17.net",
  "dyke.com",
  "e4ward.com",
  "easytrashmail.com",
  "ecallecto.com",
  "einmalmail.de",
  "eins-zwei.de",
  "email-jetable.fr",
  "emailisvalid.com",
  "emailmizer.com",
  "emailo.pro",
  "emailpinoy.com",
  "emailremoveall.com",
  "emailservicepro.com",
  "emailsydney.com",
  "emailthe.net",
  "emailto.de",
  "emailtrue.com",
  "emailuser.net",
  "emailwx.com",
  "emeil.in",
  "emeil.ir",
  "emeraldwebmail.com",
  "emil.com",
  "emz.net",
]);

/**
 * Keyword fragments found in disposable email service names/domains.
 * Used for heuristic blocking of unknown temporary mail domains.
 */
const DISPOSABLE_KEYWORDS = [
  "tempmail",
  "trashmail",
  "throwaway",
  "mailinator",
  "spammail",
  "yopmail",
  "fakeinbox",
  "guerrilla",
  "mailnull",
  "discard",
  "disposable",
  "temporary",
  "temporaire",
  "einmalig",
  "noreply",
  "antisp",
  "spamgourmet",
  "jetable",
  "maildrop",
  "burnmail",
  "burner",
  "wegwerf",
  "spam4",
  "spamfree",
  "10minute",
  "minutemail",
  "spambox",
  "deadletter",
  "deadaddress",
  "dumpmail",
  "trsh.to",
  "selfdestruc",
];

/**
 * Checks if the given email address belongs to a known disposable / throwaway
 * email provider. The check is done in two passes:
 *
 * 1. Exact domain match against the `DISPOSABLE_EMAIL_DOMAINS` Set (O(1)).
 * 2. Substring keyword heuristic to catch unknown variants of well-known services.
 */
export function isDisposableEmail(email: string): boolean {
  if (!email || !email.includes("@")) return false;
  const domain = email.split("@")[1].toLowerCase().trim();

  // 1. Exact blocklist match
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) return true;

  // 2. Heuristic keyword match on domain
  for (const kw of DISPOSABLE_KEYWORDS) {
    if (domain.includes(kw)) return true;
  }

  return false;
}
