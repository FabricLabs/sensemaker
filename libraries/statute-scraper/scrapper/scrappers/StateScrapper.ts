import { Download } from "playwright";
import { BaseScrapper } from "./BaseScrapper";

export interface StateScrapperInterface {
  statutes(): Promise<void>;
  constitution(): Promise<void>;
  rulesOfCourt(): Promise<void>;
  administrativeCodes(): Promise<void>;
}

export class StateScrapper extends BaseScrapper {

  // ------------------------------

  protected downloadConstitution = (url: string, path: string[]) => {
    return this.downloadFile(url, ['constitution', ...path]);
  }

  protected downloadStatutes = (url: string, path: string[]) => {
    return this.downloadFile(url, ['statutes', ...path]);
  }

  protected downloadRulesOfCourt = (url: string, path: string[]) => {
    return this.downloadFile(url, ['rulesOfCourt', ...path]);
  }

  protected downloadAdministrativeCodes = (url: string, path: string[]) => {
    return this.downloadFile(url, ['administrativeCodes', ...path]);
  }

  // -----------------------------

  // ------------------------------

  protected storeConstitution = (content: string | Buffer, path: string[]) => {
    return this.storeFile(content, ['constitution', ...path]);
  }

  protected storeStatutes = (content: string | Buffer, path: string[]) => {
    return this.storeFile(content, ['statutes', ...path]);
  }

  protected storeRulesOfCourt = (content: string | Buffer, path: string[]) => {
    return this.storeFile(content, ['rulesOfCourt', ...path]);
  }

  protected storeAdministrativeCodes = (content: string | Buffer, path: string[]) => {
    return this.storeFile(content, ['administrativeCodes', ...path]);
  }

  // -----------------------------

  // ------------------------------

  protected moveDownloadedConstitution = (download: Download, path: string[]) => {
    return this.moveDownloadedFile(download, ['constitution', ...path]);
  }

  protected moveDownloadedStatutes = (download: Download, path: string[]) => {
    return this.moveDownloadedFile(download, ['statutes', ...path]);
  }

  protected moveDownloadedRulesOfCourt = (download: Download, path: string[]) => {
    return this.moveDownloadedFile(download, ['rulesOfCourt', ...path]);
  }

  protected moveDownloadedAdministrativeCodes = (download: Download, path: string[]) => {
    return this.moveDownloadedFile(download, ['administrativeCodes', ...path]);
  }

}