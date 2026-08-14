"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  MessageCircle,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  HelpCircle,
  CreditCard,
  Settings,
  Flag,
  Lightbulb,
} from "lucide-react"
import { Header } from "@/components/Header"
import { Footer } from "@/components/footer"

const supportCategories = [
  { value: "technical", label: "Technical Issues", icon: Settings },
  { value: "billing", label: "Billing & Payments", icon: CreditCard },
  { value: "general", label: "General Questions", icon: HelpCircle },
  { value: "report", label: "Report a Problem", icon: Flag },
  { value: "feature_request", label: "Feature Request", icon: Lightbulb },
]

const faqItems = [
  {
    question: "How do I list my billboard?",
    answer:
      "To list your billboard, click 'List Billboard' in the header, fill out the required information including photos, pricing, and location details. Your listing will be reviewed within 24 hours.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards, debit cards, and bank transfers through our secure Paystack integration. All payments are processed in Ghana Cedis (GHS).",
  },
  {
    question: "How much does it cost to list a billboard?",
    answer:
      "Billboard owners pay per billboard upload. Current tiers include GHS 70 for 7 days and GHS 110 for 14 days. You can renew anytime, and there’s a 3-day grace period after expiry before the listing is hidden from browse.",
  },
  {
    question: "How long does it take to get approved?",
    answer:
      "Billboard listings are typically reviewed and approved within 24 hours. You'll receive an email notification once your listing is approved.",
  },
  {
    question: "Can I edit my listing after it's approved?",
    answer:
      "Yes, you can edit your listing details, pricing, and availability from your owner dashboard. Major changes may require re-approval.",
  },
  {
    question: "How do I handle inquiries from advertisers?",
    answer:
      "You'll receive email notifications for new inquiries. You can view and respond to all inquiries from your dashboard. We recommend responding within 24 hours.",
  },
]

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    category: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Here you would submit to your API
      console.log("Submitting contact form:", formData)
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setIsSubmitted(true)
    } catch (error) {
      console.error("Error submitting contact form:", error)
      alert("Failed to submit contact form. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header showBrowse />

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <Card>
              <CardContent className="p-8">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h1>
                <p className="text-gray-600 mb-6">
                  Thank you for contacting us. We've received your message and will respond within 24 hours.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600">
                    <strong>Reference ID:</strong> #CON-{Date.now().toString().slice(-6)}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Category:</strong> {supportCategories.find((cat) => cat.value === formData.category)?.label}
                  </p>
                </div>
                <div className="space-y-3">
                  <Link href="/">
                    <Button className="w-full bg-green-600 hover:bg-green-700">Return to Home</Button>
                  </Link>
                  <Button variant="outline" className="w-full" onClick={() => setIsSubmitted(false)}>
                    Send Another Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showBrowse />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Contact Us</h1>
            <p className="text-gray-600">We're here to help! Get in touch with our team.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Information */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Get in Touch</CardTitle>
                  <CardDescription>Multiple ways to reach our support team</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <MessageCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Live Chat</p>
                      <p className="text-sm text-gray-600">Available 9 AM - 6 PM GMT</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Email Support</p>
                      <p className="text-sm text-gray-600">support@xposuregh.com</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Phone Support</p>
                      <p className="text-sm text-gray-600">+233 50 416 2366</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Response Time</p>
                      <p className="text-sm text-gray-600">Within 24 hours</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Support Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {supportCategories.map((category) => {
                      const Icon = category.icon
                      return (
                        <div
                          key={category.value}
                          className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50"
                        >
                          <Icon className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{category.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Support Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Send Us a Message</CardTitle>
                  <CardDescription>
                    Fill out the form below and we'll get back to you as soon as possible
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {supportCategories.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        value={formData.subject}
                        onChange={(e) => handleInputChange("subject", e.target.value)}
                        placeholder="Brief description of your issue"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => handleInputChange("message", e.target.value)}
                        placeholder="Please provide as much detail as possible about your issue or question..."
                        rows={6}
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
                      {isSubmitting ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* FAQ Section */}
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle>Frequently Asked Questions</CardTitle>
                  <CardDescription>Quick answers to common questions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {faqItems.map((item, index) => (
                      <div key={index}>
                        <h4 className="font-medium text-gray-900 mb-2">{item.question}</h4>
                        <p className="text-sm text-gray-600">{item.answer}</p>
                        {index < faqItems.length - 1 && <Separator className="mt-4" />}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
