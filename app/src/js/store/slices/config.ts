import { createSlice } from '@reduxjs/toolkit';
import type { UserConfig } from '../../types';

export default createSlice({
  name: 'config',
  initialState: {} as UserConfig,
  reducers: {
    set: (state, action) => ({ ...state, ...action.payload }),
  },
});
