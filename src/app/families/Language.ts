import { ClosedListColumn } from "radweb";

export class Language {
  static Hebrew = new Language(0, 'לא יכולים לרדת לקחת');
  static Russian = new Language(1, 'יורדים לקחת');
  //static Amharit = new Language(20, 'אמהרית');
  constructor(public id: number, private caption: string) {
  }
  toString() {
    return this.caption;
  }
}
export class LanguageColumn extends ClosedListColumn<Language> {
    constructor() {
      super(Language, "נגישות");
    }
  
  
  }