import { type AsyncThunk, createAsyncThunk } from '@reduxjs/toolkit';
import {
  data, store, actions, AsyncMutation,
} from './store';
import * as methods from './methods';
import { client } from '../core';

export * as methods from './methods';
export {
  store, actions,
} from './store';

export type {
  Api, AsyncMutation, MutationMethod, StateType, DispatchType, StoreType, ActionsType,
} from './store';

data.methods = methods;

export type MethodsType = typeof methods;

export const createMethod = <T, R>(name: string, handler: AsyncMutation<T, R, typeof methods>): AsyncThunk<R, T, {}> => createAsyncThunk(`method/${name}`, (a: T) => handler(a, {
  dispatch: Object.assign(store.dispatch, { actions, methods: data.methods }),
  getState: store.getState,
  actions,
  methods,
  client,
}));
