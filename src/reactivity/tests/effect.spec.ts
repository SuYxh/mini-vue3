import { effect } from "../effect";
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
})