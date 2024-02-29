"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateScrapper = void 0;
const BaseScrapper_1 = require("./BaseScrapper");
class StateScrapper extends BaseScrapper_1.BaseScrapper {
    constructor() {
        // ------------------------------
        super(...arguments);
        this.downloadConstitution = (url, path) => {
            return this.downloadFile(url, ['constitution', ...path]);
        };
        this.downloadStatutes = (url, path) => {
            return this.downloadFile(url, ['statutes', ...path]);
        };
        this.downloadRulesOfCourt = (url, path) => {
            return this.downloadFile(url, ['rulesOfCourt', ...path]);
        };
        this.downloadAdministrativeCodes = (url, path) => {
            return this.downloadFile(url, ['administrativeCodes', ...path]);
        };
        // -----------------------------
        // ------------------------------
        this.storeConstitution = (content, path) => {
            return this.storeFile(content, ['constitution', ...path]);
        };
        this.storeStatutes = (content, path) => {
            return this.storeFile(content, ['statutes', ...path]);
        };
        this.storeRulesOfCourt = (content, path) => {
            return this.storeFile(content, ['rulesOfCourt', ...path]);
        };
        this.storeAdministrativeCodes = (content, path) => {
            return this.storeFile(content, ['administrativeCodes', ...path]);
        };
        // -----------------------------
        // ------------------------------
        this.moveDownloadedConstitution = (download, path) => {
            return this.moveDownloadedFile(download, ['constitution', ...path]);
        };
        this.moveDownloadedStatutes = (download, path) => {
            return this.moveDownloadedFile(download, ['statutes', ...path]);
        };
        this.moveDownloadedRulesOfCourt = (download, path) => {
            return this.moveDownloadedFile(download, ['rulesOfCourt', ...path]);
        };
        this.moveDownloadedAdministrativeCodes = (download, path) => {
            return this.moveDownloadedFile(download, ['administrativeCodes', ...path]);
        };
    }
}
exports.StateScrapper = StateScrapper;
