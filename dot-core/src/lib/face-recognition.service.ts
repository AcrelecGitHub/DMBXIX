/**
 * only used for demos
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from './environments/environment';
import { FaceRecognitionResponse } from './models/face.model';
import { FaceListResponse } from './models/face.model';
import { FaceAddResponse } from './models/face.model';
import { SimilarFacesResponse } from './models/face.model';
import { Log } from './logger/log';

@Injectable({
  providedIn: 'root'
})
export class FaceRecognitionService {
  private facesJson: Observable<Object>;
  private faces: any[];
  constructor( private httpClient: HttpClient ) { }


  public getJSON() {
    try {
      // this.facesJson = null;
      // this.faces = null;

      // // get json from file
      // this.facesJson = this.httpClient.get('./assets/facerecognition.json');

      // // get array with all messages
      // this.facesJson.subscribe(response => {
      //   this.faces = response;
      // }, err => {

      // });
    } catch (e) {
      // No content response..
      Log.debug('> Error is handled: ', e.name);
    }
  }

  getName(faceId: string) {
    if ( this.faces ) {
      for (let i = 0; i < this.faces.length; i++ ) {
        if ( this.faces[i].hasOwnProperty('faceId') && faceId === this.faces[i].faceId) {
          if (this.faces[i].hasOwnProperty('firstName')) {
            return this.faces[i].firstName;
          } else if (this.faces[i].hasOwnProperty('lastName')) {
            return this.faces[i].lastName;
          } else {
            return 'Guest';
          }
        }
      }
    } else {
      return 'guest';
    }
  }

  getPoints(faceId: string) {
    if ( this.faces ) {
      for (let i = 0; i < this.faces.length; i++ ) {
        if ( this.faces[i].hasOwnProperty('faceId') && faceId === this.faces[i].faceId) {
          if (this.faces[i].hasOwnProperty('points')) {
            return this.faces[i].points;
          } else {
            return '';
          }
        }
      }
    } else {
      return '';
    }
  }

  scanImage(subscriptionKey: string, base64Image: string, calbackfunction: Function, errorFunction: Function) {
    const headers = this.getStreamHeaders(subscriptionKey);
    const params = this.getScanParams();
    const blob = this.makeblob(base64Image);

    const imageJson = this.httpClient.post<FaceRecognitionResponse>(
      environment.endpoint,
      blob,
      {
        params,
        headers
      }
    );
    imageJson.subscribe( response => {
      calbackfunction (response) ;
      }, err => {
        errorFunction(err);
      });
  }

  addEmptyList(subscriptionKey: string, calbackfunction: Function) {
    const headers = this.getJSonHeaders(subscriptionKey);
    const body = {
      'name': 'sossolist',
      'userData': 'pictures of sosso list'
    };
    let url = environment.emptyEndpoint;
    url = url.replace('{faceListId}', 'sossolist');

    const settingsJson = this.httpClient.put<FaceListResponse>(
      url,
      body,
      {
        headers
      });

    settingsJson.subscribe(response => {
      calbackfunction(response);
      }, err => {
        calbackfunction(err);
      });
  }

  addFaceOnServer(subscriptionKey: string, base64Image: string, calbackfunction: Function, errorFunction: Function ) {
    const headers = this.getStreamHeaders(subscriptionKey);
    const params = this.getAddFaceParams();
    const blob = this.makeblob(base64Image);

    const imageJson = this.httpClient.post<FaceAddResponse>(
      environment.addEndpoint,
      blob,
      {
        params,
        headers
      }
    );
    imageJson.subscribe( response => {
      calbackfunction (response) ;
      }, err => {
        errorFunction(err);
      });
  }

  /*addFaceOnServer(subscriptionKey: string, base64Image: string) {
    const headers = this.getStreamHeaders(subscriptionKey);
    const params = this.getAddFaceParams();
    const blob = this.makeblob(base64Image);

    return this.httpClient.post<FaceAddResponse>(
      environment.addEndpoint,
      blob,
      {
        params,
        headers
      }
    );
  }*/

  findSimilarFace(subscriptionKey: string, faceId: string, calbackfunction: Function, errorFunction: Function) {

    const headers = this.getJSonHeaders(subscriptionKey);
    const body = {
      'faceId': faceId,
      'faceListId': 'sossolist',
      'maxNumOfCandidatesReturned': 1
    };

    const similarFaceJson = this.httpClient.post<SimilarFacesResponse>(
      environment.similarEndpoint,
      body,
      {
        headers
      }
    );
    similarFaceJson.subscribe(response => {
      calbackfunction(response);
      }, err => {
        errorFunction(err);
      });

  }

  private makeblob(dataURL) {
    const BASE64_MARKER = ';base64,';
    const parts = dataURL.split(BASE64_MARKER);
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);

    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], { type: contentType });
  }

  private getStreamHeaders(subscriptionKey: string) {
    let headers = new HttpHeaders();
    headers = headers.set('Content-Type', 'application/octet-stream');
    headers = headers.set('Ocp-Apim-Subscription-Key', subscriptionKey);

    return headers;
  }

  private getJSonHeaders(subscriptionKey: string) {
    let headers = new HttpHeaders();
    headers = headers.set('Content-Type', 'application/json');
    headers = headers.set('Ocp-Apim-Subscription-Key', subscriptionKey);

    return headers;
  }

  private getScanParams() {
    const httpParams = new HttpParams()
      .set('returnFaceId', 'true')
      .set('returnFaceLandmarks', 'false')
      .set(
        'returnFaceAttributes',
        'age,gender,headPose,smile,facialHair,glasses,emotion,hair,makeup,occlusion,accessories,blur,exposure,noise'
      );

    return httpParams;
  }
  private getAddFaceParams() {
    const httpParams = new HttpParams()
      .set('faceListId', 'sossolist');
    return httpParams;
  }

}

