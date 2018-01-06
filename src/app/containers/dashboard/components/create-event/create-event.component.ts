import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-create-event',
  templateUrl: './create-event.component.html',
  styleUrls: ['./create-event.component.css']
})
export class CreateEventComponent implements OnInit {
  formData = {
    event_name: '',
    session_name: '',
    launch_user_name: '',
    description: ''
  };
  constructor() {}

  ngOnInit() {}
  submit(f) {}
}
