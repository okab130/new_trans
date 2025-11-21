import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  CircularProgress,
} from '@mui/material'
import { fetchDeliveryOrders } from '@/store/slices/deliveryOrderSlice'
import type { RootState, AppDispatch } from '@/store'

export default function DeliveryOrderList() {
  const dispatch = useDispatch<AppDispatch>()
  const { orders, loading, error } = useSelector((state: RootState) => state.deliveryOrder)

  useEffect(() => {
    dispatch(fetchDeliveryOrders({}))
  }, [dispatch])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ASSIGNED':
        return 'primary'
      case 'COMPLETED':
        return 'success'
      case 'PLANNING':
        return 'warning'
      default:
        return 'default'
    }
  }

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    )
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography color="error">エラー: {error}</Typography>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        配送依頼一覧
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>依頼番号</TableCell>
              <TableCell>顧客名</TableCell>
              <TableCell>配送先</TableCell>
              <TableCell>配送日</TableCell>
              <TableCell>重量</TableCell>
              <TableCell>ステータス</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} hover>
                <TableCell>{order.orderNumber}</TableCell>
                <TableCell>{order.customer?.name}</TableCell>
                <TableCell>{order.deliveryLocation?.locationName}</TableCell>
                <TableCell>
                  {new Date(order.requestedDeliveryDate).toLocaleDateString('ja-JP')}
                </TableCell>
                <TableCell>{order.totalWeight}kg</TableCell>
                <TableCell>
                  <Chip label={order.status} color={getStatusColor(order.status)} size="small" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  )
}
