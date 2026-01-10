import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from '@layout/footer/footer';
import { Header } from "@layout/header/header";
import { Navbar } from "@layout/navbar/navbar";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, Navbar],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('badgelo');
}
