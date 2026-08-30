import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

// Language negotiation: Accept-Language header > query param > user preference > default
export function localize(req: Request, res: Response, next: NextFunction) {
  const supported: string[] = config.localization.supportedLanguages;

  // 1. Query param: ?lang=de
  let lang: string | undefined = (req.query.lang as string)?.toLowerCase();

  // 2. Accept-Language header
  const acceptLang = req.headers['accept-language'];
  if (!lang && acceptLang) {
    const headerStr = Array.isArray(acceptLang) ? acceptLang[0] : acceptLang;
    const preferred = headerStr
      .split(',')
      .map((l: string) => l.trim().split(';')[0].toLowerCase().split('-')[0])
      .find((l: string) => supported.includes(l));
    lang = preferred;
  }

  // 3. User's preferred language (set by auth middleware)
  if (!lang && (req as any).user?.preferredLang) {
    lang = (req as any).user.preferredLang;
  }

  // 4. Default
  if (!lang || !supported.includes(lang)) {
    lang = config.localization.defaultLanguage;
  }

  const finalLang: string = lang || config.localization.defaultLanguage;

  (req as any).language = finalLang;
  res.setHeader('Content-Language', finalLang);

  next();
}
