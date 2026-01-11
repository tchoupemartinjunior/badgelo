import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';  

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {            
    constructor(private http: HttpClient) { }
    
    private _uploadedFile = signal<File | null>(null);
    private _previewUrl = signal<string | null>(null);

    readonly previewUrl = this._previewUrl.asReadonly();
    readonly uploadedFile = this._uploadedFile.asReadonly();

    getUploadedFile() {
        return this.uploadedFile();
    }
    
    upload(file: File): void{
        console.log('Uploading file:', file);
        this._uploadedFile.set(file);
        this._previewUrl.set(URL.createObjectURL(file));
    }
}