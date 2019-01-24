# angular-autocomplete-directive
Awesome autocomplete module for Angular. This directive extends the default `input` field.

##Quick Use

You can extand the default input field by adding this directive and additional input fields.
  ```html
  <input appAutocomplete
    [source]="fn()"
    formControlName="name"
    type="text" placeholder="placeholder"
 />
  ```
and write a method in the controller that will return filter result and pass it to the `source` field
```typescript
fn(): Function {
  return function(value): <Observable<Array>> {
    return getSimilarItem(value);
  }.bind(this);
}

or

fn(): Function {
  return (value) => getSimilarItem(value);
}
```
