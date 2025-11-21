import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import api from '@/services/api'

export interface DeliveryOrder {
  id: string
  orderNumber: string
  customerId: string
  requestedDeliveryDate: string
  status: string
  totalWeight: number
  customer?: {
    name: string
  }
  deliveryLocation?: {
    locationName: string
  }
}

interface DeliveryOrderState {
  orders: DeliveryOrder[]
  loading: boolean
  error: string | null
  pagination: {
    page: number
    perPage: number
    total: number
    totalPages: number
  }
}

const initialState: DeliveryOrderState = {
  orders: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    perPage: 25,
    total: 0,
    totalPages: 0,
  },
}

export const fetchDeliveryOrders = createAsyncThunk(
  'deliveryOrder/fetchAll',
  async (params: any) => {
    const response = await api.get('/delivery-orders', { params })
    return response.data
  }
)

const deliveryOrderSlice = createSlice({
  name: 'deliveryOrder',
  initialState,
  reducers: {
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDeliveryOrders.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchDeliveryOrders.fulfilled, (state, action) => {
        state.loading = false
        state.orders = action.payload.data
        state.pagination = action.payload.pagination
      })
      .addCase(fetchDeliveryOrders.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'エラーが発生しました'
      })
  },
})

export const { setPage } = deliveryOrderSlice.actions
export default deliveryOrderSlice.reducer
