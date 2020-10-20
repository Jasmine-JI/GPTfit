import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-certificate-preview',
  templateUrl: './certificate-preview.component.html',
  styleUrls: ['./certificate-preview.component.scss']
})
export class CertificatePreviewComponent implements OnInit {
  sgImageUrl = '/assets/signature.jpg';
  constructor() {}

  ngOnInit() {}
  print() {
    window.print();
  }
}
