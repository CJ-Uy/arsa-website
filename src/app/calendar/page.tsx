"use client"

import { Calendar, Pin, Users, Clock, MapPin, Star, BookOpen, Coffee, Gamepad2, Film, Music, Utensils, ChevronLeft, ChevronRight } from "lucide-react"
import { EventCard } from "@/components/features/event-card"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())

  const currentMonth = currentDate.toLocaleString('default', { month: 'long' })
  const currentYear = currentDate.getFullYear()

  const goToPreviousMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() - 1)
      return newDate
    })
  }

  const goToNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + 1)
      return newDate
    })
  }

  // Mock events data
  const events = [
    {
      id: 1,
      title: "Study Hall Sessions",
      description: "Free coffee and snacks provided during study sessions",
      date: "2024-12-16T18:00:00",
      time: "6:00 PM",
      location: "Study Hall",
      category: "Academic",
      attendees: 25,
      maxCapacity: 50,
      image: "https://placehold.co/400x200",
      googleFormUrl: "https://forms.google.com/study-hall"
    },
    {
      id: 2,
      title: "Council Meeting",
      description: "Monthly council meeting to discuss dorm improvements and events",
      date: "2024-12-18T17:00:00",
      time: "5:00 PM",
      location: "Conference Room",
      category: "Meeting",
      attendees: 15,
      maxCapacity: 30,
      image: "https://placehold.co/400x200",
      googleFormUrl: "https://forms.google.com/council-meeting"
    },
    {
      id: 3,
      title: "ARSA Welcome Night",
      description: "Welcome event for new residents with games, food, and activities",
      date: "2024-12-15T19:00:00",
      time: "7:00 PM",
      location: "Common Room",
      category: "Social",
      attendees: 50,
      maxCapacity: 100,
      image: "https://placehold.co/400x200",
      googleFormUrl: "https://forms.google.com/welcome-night"
    },
    {
      id: 4,
      title: "Movie Night",
      description: "Outdoor movie screening with holiday classics",
      date: "2024-12-17T20:00:00",
      time: "8:00 PM",
      location: "Outdoor Area",
      category: "Entertainment",
      attendees: 40,
      maxCapacity: 80,
      image: "https://placehold.co/400x200",
      googleFormUrl: "https://forms.google.com/movie-night"
    },
    {
      id: 5,
      title: "Pizza Night",
      description: "Build your own pizza night with various toppings",
      date: "2024-12-20T18:30:00",
      time: "6:30 PM",
      location: "Dining Hall",
      category: "Food",
      attendees: 35,
      maxCapacity: 60,
      image: "https://placehold.co/400x200",
      googleFormUrl: "https://forms.google.com/pizza-night"
    },
    {
      id: 6,
      title: "Karaoke Night",
      description: "Sing your heart out with friends and dormmates",
      date: "2024-12-22T19:00:00",
      time: "7:00 PM",
      location: "Common Room",
      category: "Entertainment",
      attendees: 30,
      maxCapacity: 50,
      image: "https://placehold.co/400x200",
      googleFormUrl: "https://forms.google.com/karaoke-night"
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24">
        <div className="absolute inset-0">
          <img
            src="https://placehold.co/1920x1080"
            alt="Calendar Hero Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold text-white mb-6 drop-shadow-lg">
            ARSA Calendar
          </h1>
          <p className="text-xl text-white max-w-3xl mx-auto font-medium drop-shadow-md">
            Stay updated with all the events, activities, and important dates happening around the dorm.
          </p>
        </div>
      </section>

      {/* Calendar Content */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Month Header with Navigation */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousMonth}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <h2 className="text-3xl font-bold">
                {currentMonth} {currentYear}
              </h2>
              
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextMonth}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Events Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

          {/* Bottom Note */}
          <div className="text-center pt-8">
            <p className="text-muted-foreground">
              Events are updated regularly. For questions, contact your RA or check the ARSA Facebook page.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
