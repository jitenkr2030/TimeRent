'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Wallet, 
  TrendingUp, 
  ArrowDownUp, 
  IndianRupee, 
  Calendar,
  Download,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'

interface Transaction {
  id: string
  type: string
  amount: number
  status: string
  description: string
  createdAt: string
  session?: {
    sessionType: string
    seeker?: { name: string }
    giver?: { name: string }
  }
}

interface WalletData {
  balance: number
  totalEarned: number
  totalWithdrawn: number
}

export default function WalletComponent() {
  const [wallet, setWallet] = useState<WalletData>({
    balance: 0,
    totalEarned: 0,
    totalWithdrawn: 0
  })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [withdrawalLoading, setWithdrawalLoading] = useState(false)
  const [withdrawalAmount, setWithdrawalAmount] = useState('')
  const [bankDetails, setBankDetails] = useState({
    accountNumber: '',
    ifscCode: '',
    accountHolderName: ''
  })

  useEffect(() => {
    fetchWalletData()
  }, [])

  const fetchWalletData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/wallet', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setWallet(data.wallet)
        setTransactions(data.transactions)
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWithdrawal = async () => {
    if (!withdrawalAmount || parseFloat(withdrawalAmount) < 100) {
      alert('Minimum withdrawal amount is ₹100')
      return
    }

    if (!bankDetails.accountNumber || !bankDetails.ifscCode || !bankDetails.accountHolderName) {
      alert('Please fill all bank details')
      return
    }

    setWithdrawalLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/wallet', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseFloat(withdrawalAmount),
          bankDetails
        })
      })

      const data = await response.json()

      if (data.success) {
        alert('Withdrawal request submitted successfully!')
        setWithdrawalAmount('')
        setBankDetails({
          accountNumber: '',
          ifscCode: '',
          accountHolderName: ''
        })
        fetchWalletData()
      } else {
        alert(data.error || 'Withdrawal failed')
      }
    } catch (error) {
      console.error('Withdrawal error:', error)
      alert('Withdrawal failed')
    } finally {
      setWithdrawalLoading(false)
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'EARNINGS_CREDIT':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'WITHDRAWAL':
        return <Download className="h-4 w-4 text-red-600" />
      case 'SESSION_PAYMENT':
        return <ArrowDownUp className="h-4 w-4 text-blue-600" />
      default:
        return <Wallet className="h-4 w-4 text-gray-600" />
    }
  }

  const getTransactionBadge = (type: string, status: string) => {
    const colors: { [key: string]: string } = {
      'EARNINGS_CREDIT': 'bg-green-100 text-green-800',
      'WITHDRAWAL': 'bg-red-100 text-red-800',
      'SESSION_PAYMENT': 'bg-blue-100 text-blue-800'
    }

    return (
      <Badge className={colors[type] || 'bg-gray-100 text-gray-800'}>
        {type.replace('_', ' ')}
      </Badge>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading wallet...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Wallet</h1>
          <p className="text-muted-foreground">Manage your earnings and withdrawals</p>
        </div>

        {/* Wallet Balance Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-1">
                <IndianRupee className="h-5 w-5" />
                {wallet.balance.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Available for withdrawal
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-1">
                <IndianRupee className="h-5 w-5" />
                {wallet.totalEarned.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                All-time earnings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Withdrawn</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-1">
                <IndianRupee className="h-5 w-5" />
                {wallet.totalWithdrawn.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Amount withdrawn to bank
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="transactions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="withdrawal">Withdrawal</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>
                  Your recent earnings and withdrawals
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No transactions yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getTransactionIcon(transaction.type)}
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {new Date(transaction.createdAt).toLocaleDateString()}
                              {getStatusIcon(transaction.status)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${
                            transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.amount > 0 ? '+' : ''}
                            ₹{Math.abs(transaction.amount).toFixed(2)}
                          </p>
                          {getTransactionBadge(transaction.type, transaction.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdrawal">
            <Card>
              <CardHeader>
                <CardTitle>Request Withdrawal</CardTitle>
                <CardDescription>
                  Withdraw your earnings to your bank account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Important:</strong> Minimum withdrawal amount is ₹100. 
                    Withdrawals are processed within 3-5 business days.
                  </AlertDescription>
                </Alert>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Withdrawal Amount</h3>
                    <div>
                      <Label htmlFor="amount">Amount (₹)</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="Enter amount"
                        value={withdrawalAmount}
                        onChange={(e) => setWithdrawalAmount(e.target.value)}
                        min="100"
                        max={wallet.balance}
                        step="0.01"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Available balance: ₹{wallet.balance.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Bank Details</h3>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="accountHolder">Account Holder Name</Label>
                        <Input
                          id="accountHolder"
                          placeholder="Enter account holder name"
                          value={bankDetails.accountHolderName}
                          onChange={(e) => setBankDetails({
                            ...bankDetails,
                            accountHolderName: e.target.value
                          })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="accountNumber">Account Number</Label>
                        <Input
                          id="accountNumber"
                          placeholder="Enter account number"
                          value={bankDetails.accountNumber}
                          onChange={(e) => setBankDetails({
                            ...bankDetails,
                            accountNumber: e.target.value
                          })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="ifsc">IFSC Code</Label>
                        <Input
                          id="ifsc"
                          placeholder="Enter IFSC code"
                          value={bankDetails.ifscCode}
                          onChange={(e) => setBankDetails({
                            ...bankDetails,
                            ifscCode: e.target.value
                          })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleWithdrawal}
                  disabled={withdrawalLoading || !withdrawalAmount || parseFloat(withdrawalAmount) < 100}
                  className="w-full"
                  size="lg"
                >
                  {withdrawalLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </div>
                  ) : (
                    `Withdraw ₹${withdrawalAmount || '0'}`
                  )}
                </Button>

                <div className="text-sm text-muted-foreground text-center">
                  By requesting withdrawal, you confirm that all bank details are correct.
                  TimeRent is not responsible for incorrect bank details.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}