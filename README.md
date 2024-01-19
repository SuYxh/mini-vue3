## mini vue

实现最简 vue3 模型，用于深入学习 vue3， 更轻松的理解 vue3 的核心逻辑  [![github](https://img.shields.io/badge/mini--vue-blue)](https://github.com/SuYxh/mini-vue3)

## How

基于 vue3 的功能点，一点一点的拆分出来。

代码命名会保持和源码中的一致，方便大家通过命名去源码中查找逻辑。

### Tasking

#### reactivity

目标是用自己的 reactivity 支持现有的 demo 运行

- [x] reactive 的实现
- [x] ref 的实现
- [x] readonly 的实现
- [x] computed 的实现
- [x] track 依赖收集
- [x] trigger 触发依赖
- [x] 支持 isReactive
- [x] 支持嵌套 reactive
- [x] 支持 toRaw
- [x] 支持 effect.scheduler
- [x] 支持 effect.stop
- [x] 支持 isReadonly
- [x] 支持 isProxy
- [x] 支持 shallowReadonly
- [x] 支持 proxyRefs

#### runtime-core

- [ ] 支持组件类型
- [ ] 支持 element 类型
- [ ] 初始化 props
- [ ] setup 可获取 props 和 context
- [ ] 支持 component emit
- [ ] 支持 proxy
- [ ] 可以在 render 函数中获取 setup 返回的对象
- [ ] nextTick 的实现
- [ ] 支持 getCurrentInstance
- [ ] 支持 provide/inject
- [ ] 支持最基础的 slots
- [ ] 支持 Text 类型节点
- [ ] 支持 $el api
- [ ] 支持 watchEffect

### compiler-core
- [ ] 解析插值
- [ ] 解析 element
- [ ] 解析 text

### runtime-dom
- [ ] 支持 custom renderer 

### runtime-test
- [ ] 支持测试 runtime-core 的逻辑

### infrastructure
- [ ] support monorepo with pnpm



### build

```shell
pnpm build
```

### example

通过 server 的方式打开 packages/vue/example/\* 下的 index.html 即可

>  推荐使用 [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)



### 流程图

#### 响应式数据结构

![image-20240118223902472](https://qn.huat.xyz/mac/202401182239504.png)





#### 响应式系统 MVP 模型

![image-20240118223949999](https://qn.huat.xyz/mac/202401182239017.png)



#### 依赖清理

![image-20240118224016622](https://qn.huat.xyz/mac/202401182240651.png)

#### 嵌套 effect

![image-20240118224141690](https://qn.huat.xyz/mac/202401182241712.png)

#### scheduler

![image-20240118224210357](https://qn.huat.xyz/mac/202401182242379.png)

#### computed

![image-20240118224353017](https://qn.huat.xyz/mac/202401182243042.png)



#### watch

![image-20240118224413560](https://qn.huat.xyz/mac/202401182244587.png)


