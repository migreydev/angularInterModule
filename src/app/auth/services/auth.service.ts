import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable, catchError, map, of, tap, throwError } from "rxjs";
import { Router } from "@angular/router";
import { User } from "../interfaces/User";


@Injectable({
    providedIn: 'root'
})

export class AuthService {

    private apiUrlLogin = 'http://localhost:8080/auth/login';
    private apiUrlRegister = 'http://localhost:8080/auth/register';
  
    private _user!: User;
  
    get user(): User {
        return { ...this._user };
    }
  
    constructor(private http: HttpClient) { }
  
    private storageUser(resp: any): void {
        const token = resp.token;
        if (token) {
            localStorage.setItem('token', token);
            console.log('Token almacenado en localStorage:', token);
        } else {
            console.error('El token no está presente en la respuesta:', resp);
        }
        this._user = resp.user;
    }
    
    
  
    login(credentials: { username: string, password: string }): Observable<any> {
        return this.http.post(this.apiUrlLogin, credentials, { responseType: 'text' }).pipe(
          tap((token: string) => {
            this.storageUser({ token });
            console.log('Token recibido:', token);
          }),
          catchError(error => {
            console.error('Error durante el login:', error);
            return throwError(() => new Error('Login fallido: ' + error.message));
          })
        );
      }
      
      
      
  
    validateToken(): Observable<boolean> {
        const url = `${this.apiUrlLogin}/renew`;
        const headers: HttpHeaders = new HttpHeaders().set('x-token', localStorage.getItem('token') || '');
  
        return this.http.get<any>(url, { headers })
            .pipe(
                map(resp => {
                    this.storageUser(resp);
                    return true;
                }),
                catchError(err => {
                    return of(false);
                })
            );
    }
  
    register(user: any): Observable<any> {
        return this.http.post<any>(this.apiUrlRegister, user);
    }
  
    logout(): void {
        localStorage.removeItem('token');
    }
  
    getToken(): string | null {
        return localStorage.getItem('token');
    }
  
    isLoggedIn(): boolean {
        return !!this.getToken();
    }
  
    private parseJwt(token: string): any {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            return JSON.parse(atob(base64));
        } catch (error) {
            return null;
        }
    }

    getUserRole(): string | null {
        const token = localStorage.getItem('token');
        if (token) {
            const tokenPayload = this.parseJwt(token);
            return tokenPayload ? tokenPayload.role : null;
        }
        return null;
    }
    

    getUsername(): string | null {
        const token = localStorage.getItem('token');
        if (token) {
            const tokenPayload = this.parseJwt(token);
            return tokenPayload ? tokenPayload.sub : null;
        }
        return null;
    }

    getUserEmail(): string | null {
        const token = localStorage.getItem('token');
        if (token) {
            const tokenPayload = this.parseJwt(token);
            return tokenPayload ? tokenPayload.email : null;
        }
        return null;
    }

    getUserId(): number {
        const token = localStorage.getItem('token');
        if (token) {
            const tokenPayload = this.parseJwt(token);
            // Convierte el ID de usuario a número
            return tokenPayload ? +tokenPayload.userId : 0; // Asegúrate de que 'userId' sea la clave correcta
        }
        return 0; // Devuelve 0 o cualquier otro valor por defecto si el token no existe o el ID del usuario no está presente
    }
    
    
    
    
    
}