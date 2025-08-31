"use client"

import { useState } from "react"
import { Gift, Star, Package, Zap, X, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Demo gacha items with different rarities
const gachaItems = [
  // 5★ Rare items (2% chance)
  { id: 1, name: "Limited Edition ARSA Hoodie", rarity: 5, icon: "👕", color: "text-yellow-600" },
  { id: 2, name: "Vintage ARSA Jacket", rarity: 5, icon: "🧥", color: "text-yellow-600" },
  
  // 4★ Epic items (8% chance)
  { id: 3, name: "Retro ARSA T-Shirt", rarity: 4, icon: "👚", color: "text-purple-600" },
  { id: 4, name: "Classic ARSA Cap", rarity: 4, icon: "🧢", color: "text-purple-600" },
  { id: 5, name: "Limited ARSA Mug", rarity: 4, icon: "☕", color: "text-purple-600" },
  { id: 6, name: "Vintage ARSA Sticker Pack", rarity: 4, icon: "🏷️", color: "text-purple-600" },
  
  // 3★ Common items (90% chance)
  { id: 7, name: "ARSA Tote Bag", rarity: 3, icon: "👜", color: "text-blue-600" },
  { id: 8, name: "ARSA Keychain", rarity: 3, icon: "🔑", color: "text-blue-600" },
  { id: 9, name: "ARSA Pen", rarity: 3, icon: "✏️", color: "text-blue-600" },
  { id: 10, name: "ARSA Notebook", rarity: 3, icon: "📓", color: "text-blue-600" },
  { id: 11, name: "ARSA Water Bottle", rarity: 3, icon: "💧", color: "text-blue-600" },
  { id: 12, name: "ARSA Lanyard", rarity: 3, icon: "🪖", color: "text-blue-600" },
]

export function GachaBanner() {
  const [isPulling, setIsPulling] = useState(false)
  const [pulledItems, setPulledItems] = useState<typeof gachaItems>([])
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'pulling' | 'results'>('pulling')
  const [revealedItems, setRevealedItems] = useState(0)

  const getRandomItem = () => {
    const rand = Math.random() * 100
    
    if (rand < 2) {
      // 2% chance for 5★
      const rareItems = gachaItems.filter(item => item.rarity === 5)
      return rareItems[Math.floor(Math.random() * rareItems.length)]
    } else if (rand < 10) {
      // 8% chance for 4★
      const epicItems = gachaItems.filter(item => item.rarity === 4)
      return epicItems[Math.floor(Math.random() * epicItems.length)]
    } else {
      // 90% chance for 3★
      const commonItems = gachaItems.filter(item => item.rarity === 3)
      return commonItems[Math.floor(Math.random() * commonItems.length)]
    }
  }

  const performPull = (count: number) => {
    setIsPulling(true)
    setModalType('pulling')
    setShowModal(true)
    setRevealedItems(0)
    
    // Simulate gacha animation delay
    setTimeout(() => {
      const newItems = []
      for (let i = 0; i < count; i++) {
        newItems.push(getRandomItem())
      }
      
      setPulledItems(newItems)
      setModalType('results')
      setIsPulling(false)
      
      // Start revealing items one by one
      revealItemsSequentially(newItems.length)
    }, 2000)
  }

  const revealItemsSequentially = (totalItems: number) => {
    let currentIndex = 0
    
    const revealNext = () => {
      if (currentIndex < totalItems) {
        setRevealedItems(currentIndex + 1)
        currentIndex++
        
        // Reveal next item after a delay (faster now!)
        setTimeout(revealNext, 150)
      }
    }
    
    // Start revealing
    setTimeout(revealNext, 500)
  }

  const getRarityColor = (rarity: number) => {
    switch (rarity) {
      case 5: return "text-yellow-600"
      case 4: return "text-purple-600"
      case 3: return "text-blue-600"
      default: return "text-gray-600"
    }
  }

  const getRarityStars = (rarity: number) => {
    return "★".repeat(rarity)
  }

  const closeModal = () => {
    setShowModal(false)
    setPulledItems([])
  }

  const pullAgain = () => {
    // Reset all states completely
    setShowModal(false)
    setPulledItems([])
    setIsPulling(false)
    setModalType('pulling')
  }

  return (
    <>
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Gacha Banner
            </h2>
            <p className="text-lg text-muted-foreground">
              Try your luck with our limited-time gacha banner featuring rare and old merch items!
            </p>
            <div className="mt-4">
              <Badge variant="secondary" className="text-sm">
                <Zap className="h-3 w-3 mr-1" />
                Limited Time Event
              </Badge>
            </div>
          </div>

          {/* Gacha Banner Card */}
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Gift className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-2xl">
                  &ldquo;Legacy Collection&rdquo; Gacha Banner
                </CardTitle>
                <CardDescription className="text-lg">
                  Unlock rare ARSA merch from previous collections
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {/* Pull Rates */}
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <Star className="h-8 w-8 text-primary" />
                    </div>
                    <h4 className="font-semibold text-foreground mb-1">5★ Legendary</h4>
                    <p className="text-sm text-muted-foreground">2% chance</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <Star className="h-8 w-8 text-primary" />
                    </div>
                    <h4 className="font-semibold text-foreground mb-1">4★ Epic</h4>
                    <p className="text-sm text-muted-foreground">8% chance</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <Star className="h-8 w-8 text-primary" />
                    </div>
                    <h4 className="font-semibold text-foreground mb-1">3★ Rare</h4>
                    <p className="text-sm text-muted-foreground">90% chance</p>
                  </div>
                </div>

                {/* Gacha Pull Buttons */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button 
                      size="lg" 
                      onClick={() => performPull(1)}
                      disabled={isPulling}
                      className="min-w-[160px]"
                    >
                      <Gift className="h-5 w-5 mr-2" />
                      Single Pull (1x)
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline"
                      onClick={() => performPull(10)}
                      disabled={isPulling}
                      className="min-w-[160px]"
                    >
                      <Package className="h-5 w-5 mr-2" />
                      Multi Pull (10x)
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Each pull costs 1 ARSA Point. Earn points by participating in events!
                  </p>
                </div>

                {/* Current Banner Items Preview */}
                <div className="mt-8 pt-6 border-t border-border">
                  <h4 className="font-semibold text-foreground mb-4">Featured Items in This Banner:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg mx-auto mb-2 flex items-center justify-center">
                        <Package className="h-6 w-6 text-primary" />
                      </div>
                      <p className="text-xs text-muted-foreground">Limited Hoodie</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg mx-auto mb-2 flex items-center justify-center">
                        <Package className="h-6 w-6 text-primary" />
                      </div>
                      <p className="text-xs text-muted-foreground">Vintage Shirt</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg mx-auto mb-2 flex items-center justify-center">
                        <Package className="h-6 w-6 text-primary" />
                      </div>
                      <p className="text-xs text-muted-foreground">Retro Cap</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg mx-auto mb-2 flex items-center justify-center">
                        <Package className="h-6 w-6 text-primary" />
                      </div>
                      <p className="text-xs text-muted-foreground">Classic Mug</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Gacha Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-[90vw] sm:max-w-xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center">
              {modalType === 'pulling' ? '🎲 Pulling...' : '🎉 Pull Results!'}
            </DialogTitle>
          </DialogHeader>
          
          {modalType === 'pulling' && (
            <div className="text-center py-12">
              <div className="w-32 h-32 bg-primary/10 rounded-full mx-auto mb-6 flex items-center justify-center">
                <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-primary"></div>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Summoning ARSA Merch...
              </h3>
              <p className="text-muted-foreground">
                The gacha gods are deciding your fate...
              </p>
              <div className="mt-8 space-y-2">
                <div className="flex justify-center space-x-2">
                  <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}

          {modalType === 'results' && (
            <div className="py-6">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  🎊 Congratulations!
                </h3>
                <p className="text-muted-foreground">
                  You pulled {pulledItems.length} item{pulledItems.length > 1 ? 's' : ''}!
                </p>
              </div>

              {/* Mobile-friendly grid layout - single column on mobile for better visibility */}
              <div className={`grid gap-2 mb-6 ${
                pulledItems.length === 1 
                  ? 'grid-cols-1 max-w-md mx-auto' 
                  : pulledItems.length <= 4 
                    ? 'grid-cols-1 sm:grid-cols-2' 
                    : pulledItems.length <= 6 
                      ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3' 
                      : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
              }`}>
                {pulledItems.map((item, index) => (
                  <div 
                    key={`${item.id}-${index}`}
                    className={`bg-muted/50 border rounded-lg p-3 text-center transition-all duration-500 hover:bg-muted/70 ${
                      index < revealedItems 
                        ? 'opacity-100 scale-100' 
                        : 'opacity-0 scale-95'
                    }`}
                    style={{ 
                      transform: index < revealedItems ? 'translateY(0)' : 'translateY(20px)'
                    }}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <div className="text-2xl">{item.icon}</div>
                      <div className="flex-1 text-left">
                        <p className="text-sm text-foreground font-medium leading-tight">{item.name}</p>
                      </div>
                      <div className={`font-semibold text-sm ${item.color}`}>
                        {getRarityStars(item.rarity)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <Button onClick={closeModal} variant="outline">
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
