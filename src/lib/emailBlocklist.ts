export const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "mailinator.com",
  "10minutemail.com",
  "temp-mail.org",
  "yopmail.com",
  "guerrillamail.com",
  "sharklasers.com",
  "dispostable.com",
  "getnada.com",
  "maildrop.cc",
  "tempmail.com",
  "trashmail.com",
  "throwawaymail.com",
  "temp-mail.com",
  "tempail.com",
  "10minutemail.net",
  "tempmailaddress.com",
  "fakeinbox.com",
  "grr.la",
  "guerrillamail.biz",
  "guerrillamail.com",
  "guerrillamail.de",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamailblock.com",
  "pokemail.net",
  "spam4.me",
  "yopmail.fr",
  "yopmail.net",
  "cool.fr.nf",
  "brefmail.com",
  "courriel.fr.nf",
  "moncourrier.fr.nf",
  "monemail.fr.nf",
  "monmail.fr.nf",
  "hidezz.com",
  "my10minutemail.com",
  "mohmal.com",
  "nopist.com",
  "tempmail.net",
  "inboxproject.com"
]);

export function isDisposableEmail(email: string): boolean {
  if (!email || !email.includes('@')) return false;
  const domain = email.split('@')[1].toLowerCase().trim();
  if (domain.includes('yopmail') || domain.includes('mailinator') || domain.includes('tempmail')) {
      return true;
  }
  return DISPOSABLE_EMAIL_DOMAINS.has(domain);
}
