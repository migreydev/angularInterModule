import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable, catchError, map, of, tap, throwError } from "rxjs";
import { Router } from "@angular/router";
import { User } from "../interfaces/User";
import { Recipe } from "../../interfaces/Recipe";
import { jwtDecode } from 'jwt-decode';



@Injectable({
    providedIn: 'root'
})

export class AuthService {

    private apiUrlLogin = 'https://proyectoapi-migreydev.onrender.com/auth/login';
    private apiUrlRegister = 'https://proyectoapi-migreydev.onrender.com/auth/register';
  
    private _user!: User;
  
    get user(): User {
        return { ...this._user };
    }
  
    constructor(private http: HttpClient, private router: Router) { }
  
    //MEtodo para almacenar el token y el usuario
    private storageUser(resp: any): void {
        const token = resp.token;
        if (token) {
            localStorage.setItem('token', token);// Almacenar el token de acceso en el almacenamiento local
            console.log('Token', token);
        } else {
            console.error('El token no se encuentra:', resp);
        }
        this._user = resp.user;// Asignar los datos del usuario a  _user
    }
    
    
      // Metodo para iniciar sesión de usuario
    login(credentials: { username: string, password: string }): Observable<any> {
        return this.http.post(this.apiUrlLogin, credentials, { responseType: 'text' }).pipe(
          tap((token: string) => {
            this.storageUser({ token });//almacena el token si el login es correcto
            console.log('Token:', token);
          }),
          catchError(error => {
            let errorMessage = 'An unexpected failed to login, incorrect username or password';
            if (error.error instanceof ErrorEvent) {
                // Error del lado cliente o de red
                console.error('Error:', error.error.message);
            } else {
                console.error(`Error: ${error.status}`, error.error);
                errorMessage = error.error.message || errorMessage;
            }
            return throwError(() => new Error(errorMessage));
          })
        );
    }
  
    // Metodo para validar el token del usuario
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
  
    // Metodo para registrar un usuario 
    register(user: any): Observable<any> {
        return this.http.post<any>(this.apiUrlRegister, user);
    }

    // Metodo para cerrar sesión del usuario
    // - Elimina el token almacenado en el LocalStorage
    logout(): void {
        localStorage.removeItem('token');
        this.router.navigate(['/']);
    }
  
    //MEtodo para obtener el token
    getToken(): string | null {
        return localStorage.getItem('token');
    }

    // Metodo para verificar si el usuario ha iniciado sesión
    isLoggedIn(): boolean {
        return !!this.getToken(); //Devuelve true si hay un token almacenado
    }
  
    // Metodo para decodificar un token JWT
    private parseJwt(token: string): any {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            return JSON.parse(atob(base64));
        } catch (error) {
            return null;
        }
    }

    //Obtiene el rol del usuario del token
    getUserRole(): string | null {
        const token = localStorage.getItem('token');
        if (token) {
            const tokenPayload = this.parseJwt(token);
            return tokenPayload ? tokenPayload.role : null;
        }
        return null;
    }
    

    //Obteien el username del usuario del token
    getUsername(): string | null {
        const token = localStorage.getItem('token');
        if (token) {
            const tokenPayload = this.parseJwt(token);
            return tokenPayload ? tokenPayload.sub : null;
        }
        return null;
    }

    //Obtiene el email del usuario del token
    getUserEmail(): string | null {
        const token = localStorage.getItem('token');
        if (token) {
            const tokenPayload = this.parseJwt(token);
            return tokenPayload ? tokenPayload.email : null;
        }
        return null;
    }


    //Obtiene el id del usuario del token
    getUserId(): number {
        const token = localStorage.getItem('token');
        if (token) {
            const decodedToken: any = jwtDecode(token);
            return decodedToken.idUser;
        }
        return 0;
    }
    
    
    
    
     // Metodo para obtener las recetas del usuario actual
     getUserRecipes(): Observable<Recipe[]> {
        const userId = this.getUserId(); // Obtener el ID del usuario actual
        return this.http.get<Recipe[]>(`https://proyectoapi-migreydev.onrender.com/user/${userId}/recipes`);
    }

    

    
    
    
    
    
    
}


