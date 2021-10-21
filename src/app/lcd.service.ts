import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';


@Injectable({
    providedIn: 'root',
})
export class LcdService {

    lcdHost: string
    constructor(private http: HttpClient) {
        this.lcdHost = "https://lcd.terra.dev"
    }

    setLcdHost(lcdHost: string) {
        this.lcdHost = lcdHost
    }
    getQuery(contract: string, query: any) {
        return this.http.get<any>(this.lcdHost + "/wasm/contracts/" + contract + "/store?query_msg=" + JSON.stringify(query));
    }
}