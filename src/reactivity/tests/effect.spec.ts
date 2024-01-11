import { effect, stop } from "../effect";
import { reactive } from "../reactive"

describe('effect', () => {
  
  it('happy path', () => {

    const user = reactive({
      age: 18
    })

    let nextAge;

    effect(() => {
      nextAge = user.age + 1
    })

    expect(nextAge).toBe(19)

    user.age ++ 
    expect(nextAge).toBe(20)
  })

  it('happy two effect', () => {

    const user = reactive({
      age: 18
    })

    let nextAge;

    effect(() => {
      nextAge = user.age + 1
    })

    effect(() => {
      nextAge = nextAge + 1
    })

    expect(nextAge).toBe(20)

    user.age ++ 

    expect(nextAge).toBe(21)
  })

  it('happy two value', () => {

    const user = reactive({
      name: 'dahuang',
      age: 18
    })

    let nextAge, nextName;

    effect(() => {
      nextAge = user.age + 1
    })

    effect(() => {
      nextName = user.name
    })

    expect(nextName).toBe('dahuang')

    expect(nextAge).toBe(19)

    user.age ++ 

    user.name = 'jk'

    expect(nextAge).toBe(20)
    expect(nextName).toBe('jk')
  })

  it("should return runner when call effect", () => {
    // 当调用 runner 的时候可以重新执行 effect.run
    // runner 的返回值就是用户给的 fn 的返回值
    let foo = 0;
    const runner = effect(() => {
      foo++;
      return foo;
    });

    expect(foo).toBe(1);
    runner();
    expect(foo).toBe(2);
    expect(runner()).toBe(3);
  });

  it("scheduler", () => {
    let dummy;
    let run: any;
    const scheduler = jest.fn(() => {
      run = runner;
    });
    const obj = reactive({ foo: 1 });
    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      { scheduler }
    );
    expect(scheduler).not.toHaveBeenCalled();
    expect(dummy).toBe(1);
    // should be called on first trigger
    obj.foo++;
    expect(scheduler).toHaveBeenCalledTimes(1);
    // // should not run yet
    expect(dummy).toBe(1);
    // // manually run
    run();
    // // should have run
    expect(dummy).toBe(2);
  });

  it("stop", () => {
    let dummy;
    const obj = reactive({ prop: 1 });
    const runner = effect(() => {
      dummy = obj.prop;
    });
    obj.prop = 2;
    expect(dummy).toBe(2);
    stop(runner);
    obj.prop = 3;
    expect(dummy).toBe(2);

    // stopped effect should still be manually callable
    runner();
    expect(dummy).toBe(3);
  });
})