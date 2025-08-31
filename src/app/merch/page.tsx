import { ShoppingBag, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GachaBanner } from "@/components/features/gacha-banner"

export default function MerchPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <div
            className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: "url('https://placehold.co/1920x1080')"
            }}
          />
        </div>
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 z-0 bg-black/60" />
        
        {/* Content Overlay */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-white mb-6 drop-shadow-lg">
              ARSA Merch
            </h1>
            <p className="text-xl text-white max-w-3xl mx-auto font-medium drop-shadow-md">
              Show your ARSA pride with official merchandise and discover rare items through our gacha system
            </p>
          </div>
        </div>
      </section>

      <GachaBanner />

      {/* Regular Merch Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Regular Merchandise
            </h2>
            <p className="text-lg text-muted-foreground">
              Order your favorite ARSA merchandise directly
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Hoodies */}
            <Card className="flex flex-col">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <ShoppingBag className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>ARSA Hoodies</CardTitle>
                <CardDescription>
                  Comfortable and stylish hoodies with ARSA branding
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center flex-1 flex flex-col">
                <div className="space-y-3 mb-4 flex-1">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Available Sizes:</span> XS, S, M, L, XL<br />
                    <span className="font-medium">Colors:</span> Black, Navy, Gray
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    ₱1,200
                  </p>
                </div>
                <div className="mt-auto">
                  <Button className="w-full" asChild>
                    <a href="https://forms.google.com/merch-order-form" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center space-x-2">
                      <span>Order Now</span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* T-Shirts */}
            <Card className="flex flex-col">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <ShoppingBag className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>ARSA T-Shirts</CardTitle>
                <CardDescription>
                  Classic t-shirts perfect for everyday wear
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center flex-1 flex flex-col">
                <div className="space-y-3 mb-4 flex-1">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Available Sizes:</span> XS, S, M, L, XL<br />
                    <span className="font-medium">Colors:</span> White, Black, Blue
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    ₱800
                  </p>
                </div>
                <div className="mt-auto">
                  <Button className="w-full" asChild>
                    <a href="https://forms.google.com/merch-order-form" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center space-x-2">
                      <span>Order Now</span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Caps */}
            <Card className="flex flex-col">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <ShoppingBag className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>ARSA Caps</CardTitle>
                <CardDescription>
                  Adjustable caps with embroidered ARSA logo
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center flex-1 flex flex-col">
                <div className="space-y-3 mb-4 flex-1">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Style:</span> Baseball Cap<br />
                    <span className="font-medium">Colors:</span> Black, White, Navy
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    ₱500
                  </p>
                </div>
                <div className="mt-auto">
                  <Button className="w-full" asChild>
                    <a href="https://forms.google.com/merch-order-form" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center space-x-2">
                      <span>Order Now</span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Mugs */}
            <Card className="flex flex-col">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <ShoppingBag className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>ARSA Mugs</CardTitle>
                <CardDescription>
                  Ceramic mugs perfect for your morning coffee
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center flex-1 flex flex-col">
                <div className="space-y-3 mb-4 flex-1">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Capacity:</span> 12 oz<br />
                    <span className="font-medium">Material:</span> Ceramic
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    ₱300
                  </p>
                </div>
                <div className="mt-auto">
                  <Button className="w-full" asChild>
                    <a href="https://forms.google.com/merch-order-form" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center space-x-2">
                      <span>Order Now</span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stickers */}
            <Card className="flex flex-col">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <ShoppingBag className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>ARSA Stickers</CardTitle>
                <CardDescription>
                  High-quality vinyl stickers for laptops and water bottles
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center flex-1 flex flex-col">
                <div className="space-y-3 mb-4 flex-1">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Pack:</span> 5 stickers<br />
                    <span className="font-medium">Size:</span> 3&quot; x 3&quot;
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    ₱150
                  </p>
                </div>
                <div className="mt-auto">
                  <Button className="w-full" asChild>
                    <a href="https://forms.google.com/merch-order-form" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center space-x-2">
                      <span>Order Now</span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tote Bags */}
            <Card className="flex flex-col">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <ShoppingBag className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>ARSA Tote Bags</CardTitle>
                <CardDescription>
                  Eco-friendly canvas tote bags for shopping and daily use
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center flex-1 flex flex-col">
                <div className="space-y-3 mb-4 flex-1">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Material:</span> Canvas<br />
                    <span className="font-medium">Colors:</span> Natural, Black
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    ₱400
                  </p>
                </div>
                <div className="mt-auto">
                  <Button className="w-full" asChild>
                    <a href="https://forms.google.com/merch-order-form" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center space-x-2">
                      <span>Order Now</span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How to Order Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              How to Order
            </h2>
            <p className="text-lg text-muted-foreground">
              Simple steps to get your ARSA merchandise
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Fill Out Form
              </h3>
              <p className="text-muted-foreground">
                Complete the order form with your details and merchandise selection
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Wait for Confirmation
              </h3>
              <p className="text-muted-foreground">
                We&apos;ll confirm your order and provide pickup/delivery details
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Collect Your Merch
              </h3>
              <p className="text-muted-foreground">
                Pick up your merchandise from our office or arrange delivery
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Button size="lg" asChild>
              <a href="https://forms.google.com/merch-order-form" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center space-x-2">
                <span>Start Your Order</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Contact & Support */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Questions About Merch?
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Need help with sizing, availability, or have other questions?
            </p>
            <div className="bg-muted/50 rounded-lg p-8">
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Contact our merch team for assistance with orders, sizing questions, 
                  or to learn more about our gacha system and how to earn ARSA Points.
                </p>
                                 <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                   <ShoppingBag className="h-4 w-4" />
                   <span>merch@arsa.edu</span>
                 </div>
                <p className="text-sm text-muted-foreground">
                  Visit our Contact page for more ways to reach us.
                </p>
                <div className="pt-4">
                  <a
                    href="/contact"
                    className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                  >
                    Contact Us
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
