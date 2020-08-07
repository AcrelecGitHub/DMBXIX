import { Injectable } from '@angular/core';
import {
  DotTreeLoader,
  DotTree,
  DotPage,
  FilesLoaderService,
  DotCatalogLoader
} from 'dotsdk';
import { AppSettingsService } from './app-settings.service';
import { DotCatalog } from "dotsdk/src/data/models/dot-catalog.model";

@Injectable({
  providedIn: 'root'
})
export class ContentService {

  public dotTree: DotTree;
  public dotCatalog: DotCatalog;

  constructor(private appSettings: AppSettingsService) {
    // Listen for any update from DOTXIX-DataDeliveryService App:
    FilesLoaderService.getInstance().listenForUpdates().subscribe(async response => {
      this.initialize();
    });
  }

  /**
   * Shortcut for MainPage:
   */
  public get mainPage(): DotPage {
    return this.dotTree.MainPage;
  }

  /**
   * This function will get load in App Intializa phase, so the content will be ready when the App gets rendered
   */
  public async initialize() {
    // In example below, FilesLoaderService will register proper loaders ALL default .json files.
    FilesLoaderService.getInstance().registerDefaultLoaders(this.appSettings.acreBridgeAssets);

    // The Actual Files Load call:
    // As FilesLoaderService uses Singleton Pattern, you may use your models anywhere in your App
    await FilesLoaderService.getInstance().initialize();

    // Retrive data from DotTreeLoader (loader for pages.json)
    this.dotTree = DotTreeLoader.getInstance().loadedModel;
    this.dotCatalog = DotCatalogLoader.getInstance().loadedModel;
    return true;
  }

  /**
   * Please keep in mind this is a demo!
   * For an easier demo, we search recursivly each time a page is in need.
   * You will not want to recursively check each time!
   * @param buttonLink the DotButton's jsut pressed Link
   */
  public getPageByButtonLink(buttonLink: string) {
    return this.getPage(this.dotTree.MainPage, buttonLink);
  }

  /**
   * Please keep in mind this is a demo!
   * For an easier demo, we search recursivly each time a page is in need.
   * You will not want to recursively check each time!
   * @param buttonLink the DotButton's jsut pressed Link
   */
  public getButtonByLink(link: string) {
    // console.log('getButtonByLink ', link);
    return this.getButton(this.dotTree.MainPage, link);
  }

  /**
   * Will search recursively for a Page baased on ID
   * @param page
   * @param id
   */
  private getPage(page: DotPage, id: string) {
    if (page.ID === id) {
      return page;
    }
    if (page.Buttons) {
      for (let i = 0; i < page.Buttons.length; i++) {
        const btn = page.Buttons[i];
        if (btn.Page) {
          const pg = this.getPage(btn.Page, id);
          if (pg) {
            return pg;
          }
        }
      }
    }
    return null;
  }

  /**
   * Will search recursively for a Page baased on ID
   * @param page
   * @param id
   */
  private getButton(page: DotPage, link: string) {
    if (page.Buttons) {
      for (let i = 0; i < page.Buttons.length; i++) {
        const btn = page.Buttons[i];
        if (btn.Link === link) {
          return btn;
        } else if (btn.Page && btn.Page.Buttons) {
          const btn2 = this.getButton(btn.Page, link);
          if (btn2) {
            return btn2;
          }
        }
      }
    }
    return null;
  }


  private getBtnData(){
    return  {
      "Selected": false,
      "Enabled": true,
      "Picture": "img_ac5afdce-07cc-423e-889d-3f12b2ee28bb.png",
      "Caption": "Special of the Month",
      "Description": null,
      "Visible": true,
      "ButtonType": 2,
      "PageID": null,
      "DisplayMode": null,
      "DlgMessage": "",
      "Link": "SPECIAL",
      "ButtonStatus": "1",
      "ServiceType": 3,
      "DefaultQuantity": 0,
      "MinQuantity": 0,
      "ChargeThreshold": 0,
      "MaxQuantity": 0,
      "Visibility": "0",
      "Tags": "Vegetarian,Gluten Free",
      "Order": 1,
      "MinPrice": 200,
      "PictureDictionary": null,
      "CaptionDictionary": null,
      "DescriptionDictionary": null,
      "DlgMessageDictionary": null,
      "ComboPage": null,
      "ModifiersPage": null,
      "Page": null,
      "PriceLevel": null,
      "Scoring": null,
      "SuggestivePages": null,
      "Thumb": null,
      "ThumbDictionary": null,
      "AutoComplete": null,
      "IncludedQuantity": null,
      "MaxQty": null,
      "ComplementId": null,
      "Categories": null,
      "VisibleOn": null,
      "Replacing": null,
      "StartSize": null,
      "Avlb": null
    };
  }

}
