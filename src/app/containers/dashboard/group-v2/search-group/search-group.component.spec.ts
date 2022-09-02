import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SearchGroupComponent } from './search-group.component';

describe('SearchGroupComponent', () => {
  let component: SearchGroupComponent;
  let fixture: ComponentFixture<SearchGroupComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SearchGroupComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
