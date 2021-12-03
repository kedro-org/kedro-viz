// const {  handleKeyEvent } = utils;

// test('handleKeyEvent is a function', () => {
//     expect(typeof handleKeyEvent)
//       .toBe('function');
//   });

//   test('Invokes the correct actions when supplied a keycode', () => {
//     const toCall = sinon.spy();
//     const notToCall = sinon.spy();

//     // 27 is keycode for escape
//     handleKeyEvent(27, {
//       escape: toCall,
//       enter: notToCall
//     });

//     expect(toCall.callCount)
//       .toBe(1);

//     expect(notToCall.callCount)
//       .toBe(0);
//   });

//   test('Should return function if no actions are supplied', () => {
//     expect(typeof handleKeyEvent(27))
//       .toBe('function');
//   });

//   test('Should invoke correctly when single key is supplied', () => {
//     const hke = handleKeyEvent(27);
//     const spy = sinon.spy();

//     hke('escape', spy);
//   x
//     expect(spy.callCount)
//       .toBe(1);
//   });

//   test('Should invoke correctly when multiple keys are supplied', () => {
//     const spy = sinon.spy();

//     /** Test key code */
//     const t = keyCode => {
//       handleKeyEvent(keyCode)('escape,enter', spy);
//     };

//     [27, 13].forEach(v => {
//       t(v);
//     });

//     expect(spy.callCount)
//       .toBe(2);
//   });

//   test('Should throw if invalid values supplied', () => {
//     /** Test null params */
//     const t1 = () => {
//       handleKeyEvent(null, null)();
//     };

//     /** Test empty params */
//     const t2 = () => {
//       handleKeyEvent()();
//     };

//     /** Test invalid params */
//     const t3 = () => {
//       handleKeyEvent(123, 'hello')();
//     };

//     expect(t1)
//       .toThrow();

//     expect(t2)
//       .toThrow();

//     expect(t3)
//       .toThrow();
//   });
