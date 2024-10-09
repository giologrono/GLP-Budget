"use client"

import { useState, useEffect, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { jsPDF } from "jspdf"
import "jspdf-autotable"

const cityStateAllocations = {
  "New York": {
    "New York": {
      "Venue": 28,
      "Catering": 23,
      "Photography": 10,
      "Attire": 8,
      "Flowers": 7,
      "Music": 5,
      "Invitations": 3,
      "Favors": 2,
      "Wedding Planner": 5,
      "Miscellaneous": 9
    },
    "Buffalo": {
      "Venue": 24,
      "Catering": 26,
      "Photography": 12,
      "Attire": 9,
      "Flowers": 6,
      "Music": 5,
      "Invitations": 3,
      "Favors": 2,
      "Wedding Planner": 4,
      "Miscellaneous": 9
    }
  },
  "California": {
    "Los Angeles": {
      "Venue": 26,
      "Catering": 24,
      "Photography": 12,
      "Attire": 7,
      "Flowers": 8,
      "Music": 6,
      "Invitations": 3,
      "Favors": 2,
      "Wedding Planner": 6,
      "Miscellaneous": 6
    },
    "San Francisco": {
      "Venue": 30,
      "Catering": 22,
      "Photography": 11,
      "Attire": 8,
      "Flowers": 7,
      "Music": 5,
      "Invitations": 3,
      "Favors": 2,
      "Wedding Planner": 7,
      "Miscellaneous": 5
    }
  },
  "Texas": {
    "Houston": {
      "Venue": 25,
      "Catering": 26,
      "Photography": 11,
      "Attire": 9,
      "Flowers": 7,
      "Music": 5,
      "Invitations": 3,
      "Favors": 2,
      "Wedding Planner": 4,
      "Miscellaneous": 8
    },
    "Austin": {
      "Venue": 26,
      "Catering": 25,
      "Photography": 12,
      "Attire": 8,
      "Flowers": 7,
      "Music": 6,
      "Invitations": 3,
      "Favors": 2,
      "Wedding Planner": 5,
      "Miscellaneous": 6
    }
  }
}

const COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8",
  "#82CA9D", "#A4DE6C", "#D0ED57", "#FAD000", "#F66D44"
]

const currencies = {
  "USD": { symbol: "$", rate: 1 },
  "EUR": { symbol: "€", rate: 0.84 },
  "GBP": { symbol: "£", rate: 0.72 },
  "JPY": { symbol: "¥", rate: 110.14 }
}

export default function Component() {
  const [budget, setBudget] = useState("")
  const [state, setState] = useState("")
  const [city, setCity] = useState("")
  const [allocations, setAllocations] = useState({})
  const [showResults, setShowResults] = useState(false)
  const [error, setError] = useState("")
  const [currency, setCurrency] = useState("USD")
  const [weddingDate, setWeddingDate] = useState(new Date())
  const [actualExpenses, setActualExpenses] = useState({})
  const [customCategories, setCustomCategories] = useState([])

  const availableCities = useMemo(() => {
    return state ? Object.keys(cityStateAllocations[state] || {}) : []
  }, [state])

  useEffect(() => {
    const savedBudget = localStorage.getItem("weddingBudget")
    if (savedBudget) {
      const parsedBudget = JSON.parse(savedBudget)
      setBudget(parsedBudget.budget)
      setState(parsedBudget.state)
      setCity(parsedBudget.city)
      setAllocations(parsedBudget.allocations)
      setShowResults(true)
      setCurrency(parsedBudget.currency || "USD")
      setWeddingDate(new Date(parsedBudget.weddingDate) || new Date())
      setActualExpenses(parsedBudget.actualExpenses || {})
      setCustomCategories(parsedBudget.customCategories || [])
    }
  }, [])

  const calculateAllocations = () => {
    setError("")
    const totalBudget = parseFloat(budget)
    if (isNaN(totalBudget) || totalBudget <= 0) {
      setError("Please enter a valid budget amount.")
      return
    }
    if (!state || !city || !cityStateAllocations[state] || !cityStateAllocations[state][city]) {
      setError("Please select a valid state and city combination.")
      return
    }

    const newAllocations = {}
    Object.entries(cityStateAllocations[state][city]).forEach(([vendor, percentage]) => {
      newAllocations[vendor] = (totalBudget * percentage) / 100
    })
    setAllocations(newAllocations)
    setShowResults(true)
    saveBudget(totalBudget, newAllocations)
  }

  const handleAllocationChange = (vendor, newValue) => {
    const totalBudget = parseFloat(budget)
    const newAllocations = { ...allocations }
    const oldValue = newAllocations[vendor]
    newAllocations[vendor] = newValue

    const difference = newValue - oldValue
    const remainingVendors = Object.keys(newAllocations).filter(v => v !== vendor)
    const totalRemaining = remainingVendors.reduce((sum, v) => sum + newAllocations[v], 0)

    remainingVendors.forEach(v => {
      const proportion = newAllocations[v] / totalRemaining
      newAllocations[v] -= difference * proportion
    })

    setAllocations(newAllocations)
    saveBudget(totalBudget, newAllocations)
  }

  const saveBudget = (totalBudget, newAllocations) => {
    localStorage.setItem("weddingBudget", JSON.stringify({
      budget: totalBudget,
      state,
      city,
      allocations: newAllocations,
      currency,
      weddingDate,
      actualExpenses,
      customCategories
    }))
  }

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.text("Wedding Budget Allocation", 20, 10)
    doc.autoTable({
      head: [["Category", "Allocated Budget", "Actual Expenses"]],
      body: Object.entries(allocations).map(([category, amount]) => [
        category,
        `${currencies[currency].symbol}${(amount / currencies[currency].rate).toFixed(2)}`,
        `${currencies[currency].symbol}${((actualExpenses[category] || 0) / currencies[currency].rate).toFixed(2)}`
      ])
    })
    doc.save("wedding-budget.pdf")
  }

  const exportCSV = () => {
    let csv = "Category,Allocated Budget,Actual Expenses\n"
    Object.entries(allocations).forEach(([category, amount]) => {
      csv += `${category},${currencies[currency].symbol}${(amount / currencies[currency].rate).toFixed(2)},${currencies[currency].symbol}${((actualExpenses[category] || 0) / currencies[currency].rate).toFixed(2)}\n`
    })
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", "wedding-budget.csv")
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleActualExpenseChange = (category, amount) => {
    setActualExpenses(prev => {
      const updated = { ...prev, [category]: parseFloat(amount) || 0 }
      saveBudget(parseFloat(budget), allocations)
      return updated
    })
  }

  const addCustomCategory = () => {
    const newCategory = prompt("Enter the name of the new category:")
    if (newCategory && !allocations[newCategory]) {
      setCustomCategories(prev => [...prev, newCategory])
      setAllocations(prev => ({ ...prev, [newCategory]: 0 }))
      saveBudget(parseFloat(budget), { ...allocations, [newCategory]: 0 })
    }
  }

  const removeCustomCategory = (category) => {
    setCustomCategories(prev => prev.filter(c => c !== category))
    setAllocations(prev => {
      const { [category]: removed, ...rest } = prev
      saveBudget(parseFloat(budget), rest)
      return rest
    })
  }

  const pieChartData = Object.entries(allocations).map(([name, value]) => ({ name, value }))
  const comparisonData = Object.entries(allocations).map(([category, amount]) => ({
    category,
    allocated: amount,
    actual: actualExpenses[category] || 0
  }))

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Wedding Budget Allocator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="budget">Total Budget</Label>
              <div className="flex gap-2">
                <Input
                  id="budget"
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="Enter your total budget"
                  aria-describedby="budget-error"
                />
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(currencies).map((curr) => (
                      <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Select value={state} onValueChange={(value) => { setState(value); setCity(""); }}>
                <SelectTrigger id="state">
                  <SelectValue placeholder="Select a state" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(cityStateAllocations).map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Select value={city} onValueChange={setCity} disabled={!state}>
                <SelectTrigger id="city">
                  <SelectValue placeholder="Select a city" />
                </SelectTrigger>
                <SelectContent>
                  {availableCities.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="wedding-date">Wedding Date</Label>
              <Calendar
                mode="single"
                selected={weddingDate}
                onSelect={(date) => setWeddingDate(date || new Date())}
                className="rounded-md border"
              />
            </div>
            <Button onClick={calculateAllocations}>Calculate Allocations</Button>
          </div>
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {showResults && (
        <Card>
          <CardHeader>
            <CardTitle>Budget Allocations</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="allocations">
              <TabsList>
                <TabsTrigger value="allocations">Allocations</TabsTrigger>
                <TabsTrigger value="comparison">Comparison</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>
              <TabsContent value="allocations">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    {Object.entries(allocations).map(([vendor, amount]) => (
                      <div key={vendor}>
                        <Label>{vendor}</Label>
                        <div className="flex items-center gap-4">
                          <Slider
                            min={0}
                            max={parseFloat(budget)}
                            step={10}
                            value={[amount]}
                            onValueChange={(value) => handleAllocationChange(vendor, value[0])}
                            aria-label={`Adjust budget for ${vendor}`}
                          />
                          <span className="w-24 text-right">
                            {currencies[currency].symbol}{(amount / currencies[currency].rate).toFixed(2)}
                          </span>
                        </div>
                        <Input
                          type="number"
                          placeholder="Actual Expense"
                          value={actualExpenses[vendor] || ""}
                          onChange={(e) => handleActualExpenseChange(vendor, e.target.value)}
                          className="mt-2"
                        />
                      
                      </div>
                    ))}
                    <Button onClick={addCustomCategory} className="mt-4">Add Custom Category</Button>
                    {customCategories.map((category) => (
                      <Button key={category} onClick={() => removeCustomCategory(category)} variant="outline" className="mt-2 ml-2">
                        Remove {category}
                      </Button>
                    ))}
                  </div>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${currencies[currency].symbol}${(value / currencies[currency].rate).toFixed(2)}`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="comparison">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip formatter={(value) => `${currencies[currency].symbol}${(value / currencies[currency].rate).toFixed(2)}`} />
                      <Legend />
                      <Bar dataKey="allocated" fill="#8884d8" name="Allocated" />
                      <Bar dataKey="actual" fill="#82ca9d" name="Actual" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
              <TabsContent value="timeline">
                <div className="space-y-4">
                  {Object.keys(allocations).map((vendor) => (
                    <div key={vendor}>
                      <h3 className="font-semibold">{vendor}</h3>
                      <p>Suggested booking: {format(new Date(weddingDate.getTime() - getBookingOffset(vendor)), "MMMM d, yyyy")}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
            <div className="flex justify-end space-x-4 mt-4">
              <Button onClick={exportPDF}>Export as PDF</Button>
              <Button onClick={exportCSV}>Export as CSV</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function getBookingOffset(vendor) {
  const offsets = {
    "Venue": 365 * 24 * 60 * 60 * 1000, // 1 year
    "Wedding Planner": 365 * 24 * 60 * 60 * 1000, // 1 year
    "Catering": 270 * 24 * 60 * 60 * 1000, // 9 months
    "Photography": 270 * 24 * 60 * 60 * 1000, // 9 months
    "Attire": 240 * 24 * 60 * 60 * 1000, // 8 months
    "Flowers": 180 * 24 * 60 * 60 * 1000, // 6 months
    "Music": 180 * 24 * 60 * 60 * 1000, // 6 months
    "Invitations": 120 * 24 * 60 * 60 * 1000, // 4 months
    "Favors": 90 * 24 * 60 * 60 * 1000, // 3 months
  }
  return offsets[vendor] || 180 * 24 * 60 * 60 * 1000 // Default to 6 months
}