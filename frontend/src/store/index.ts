import { configureStore } from '@reduxjs/toolkit'
import deliveryOrderReducer from './slices/deliveryOrderSlice'
import authReducer from './slices/authSlice'

export const store = configureStore({
  reducer: {
    deliveryOrder: deliveryOrderReducer,
    auth: authReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
