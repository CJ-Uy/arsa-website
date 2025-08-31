import { Calendar, MapPin, Users, Clock, ArrowRight, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface EventCardProps {
  event: {
    id: number
    title: string
    date: string
    time: string
    location: string
    description: string
    attendees: number
    maxCapacity: number
    category: string
    featured?: boolean
    googleFormUrl?: string
  }
  variant?: "default" | "featured"
}

export function EventCard({ event, variant = "default" }: EventCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      weekday: 'short'
    })
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Social': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'Academic': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'Entertainment': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'Community': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'Food': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'Meeting': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  if (variant === "featured") {
    return (
      <div className="bg-card/95 backdrop-blur-sm rounded-lg p-6 shadow-xl border border-border">
        <div className="flex items-center justify-between mb-4">
          <Badge className={getCategoryColor(event.category)}>
            {event.category}
          </Badge>
          <Badge variant="secondary">
            <Star className="h-3 w-3 mr-1" />
            Featured
          </Badge>
        </div>
        <h3 className="text-xl font-bold text-card-foreground mb-2">
          {event.title}
        </h3>
        <p className="text-muted-foreground mb-4">
          {event.description}
        </p>
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-2" />
            {formatDate(event.date)} at {event.time}
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-2" />
            {event.location}
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="h-4 w-4 mr-2" />
            {event.attendees}/{event.maxCapacity} attending
          </div>
        </div>
        <Button className="w-full" asChild>
          <a 
            href={event.googleFormUrl || "#"} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center"
          >
            <span>Join Event</span>
            <ArrowRight className="h-4 w-4 ml-2" />
          </a>
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-lg border border-border hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <Badge className={getCategoryColor(event.category)}>
            {event.category}
          </Badge>
          <div className="text-sm text-muted-foreground">
            {formatDate(event.date)}
          </div>
        </div>
        <h3 className="text-lg font-semibold text-card-foreground mb-2">{event.title}</h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {event.description}
        </p>
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-2" />
            {event.time}
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-2" />
            {event.location}
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="h-4 w-4 mr-2" />
            {event.attendees}/{event.maxCapacity} attending
          </div>
        </div>
        <Button size="sm" className="w-full" asChild>
          <a 
            href={event.googleFormUrl || "#"} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center"
          >
            Join Event
            <ArrowRight className="h-4 w-4 ml-2" />
          </a>
        </Button>
      </div>
    </div>
  )
}
