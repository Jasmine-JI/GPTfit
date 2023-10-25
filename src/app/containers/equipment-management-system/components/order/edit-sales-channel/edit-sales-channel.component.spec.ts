import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditSalesChannelComponent } from './edit-sales-channel.component';

describe('EditSalesChannelComponent', () => {
  let component: EditSalesChannelComponent;
  let fixture: ComponentFixture<EditSalesChannelComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EditSalesChannelComponent],
    });
    fixture = TestBed.createComponent(EditSalesChannelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
