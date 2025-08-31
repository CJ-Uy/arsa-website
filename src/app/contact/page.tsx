import { Mail, Phone, MapPin, FileText, MessageSquare, Clock, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ContactPage() {
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
              Contact Us
            </h1>
            <p className="text-xl text-white max-w-3xl mx-auto font-medium drop-shadow-md">
              Get in touch with ARSA. We're here to help with any questions, 
              concerns, or feedback about dorm life.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Methods Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              How to Reach Us
            </h2>
            <p className="text-lg text-muted-foreground">
              Choose the best way to get in touch with our team
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Email Contact */}
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Email Us</CardTitle>
                <CardDescription>
                  Send us a message for general inquiries
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <a 
                  href="mailto:arsa.college.org@student.ateneo.edu"
                  className="text-primary hover:underline font-medium"
                >
                  arsa.college.org@student.ateneo.edu
                </a>
                <p className="text-sm text-muted-foreground mt-2">
                  We'll respond within 24 hours
                </p>
              </CardContent>
            </Card>

            {/* Phone Contact */}
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Phone className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Call Us</CardTitle>
                <CardDescription>
                  Speak directly with our team
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-foreground font-medium">
                  +1 (555) 123-4567
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Mon-Fri: 9:00 AM - 5:00 PM
                </p>
              </CardContent>
            </Card>

            {/* Office Location */}
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <MapPin className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Visit Us</CardTitle>
                <CardDescription>
                  Drop by our office
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-foreground font-medium">
                  Dorm Building A, Room 101
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Office hours: Mon-Fri 9AM-5PM
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Grievance Forms Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Grievance Forms
            </h2>
            <p className="text-lg text-muted-foreground">
              Report issues, submit complaints, or request assistance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* General Grievance Form */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>General Grievance</CardTitle>
                    <CardDescription>
                      Report general issues or concerns
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Use this form for general complaints, suggestions, or issues 
                  related to dorm life, facilities, or services.
                </p>
                <Button className="w-full" asChild>
                  <a 
                    href="https://forms.google.com/your-grievance-form-link" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-2"
                  >
                    <span>Submit Grievance</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Maintenance Request Form */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Maintenance Request</CardTitle>
                    <CardDescription>
                      Report facility or equipment issues
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Report broken facilities, equipment malfunctions, or 
                  maintenance issues in your dorm or common areas.
                </p>
                <Button className="w-full" asChild>
                  <a 
                    href="https://forms.google.com/your-maintenance-form-link" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-2"
                  >
                    <span>Submit Request</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Quick Contact Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Need Immediate Help?
            </h2>
            <p className="text-lg text-muted-foreground">
              For urgent matters or emergency situations
            </p>
          </div>

          <div className="bg-primary/5 rounded-lg p-8 border border-primary/20">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Emergency Contact
              </h3>
              <p className="text-muted-foreground mb-4">
                For urgent matters outside office hours
              </p>
              <div className="space-y-2">
                <p className="text-foreground font-medium">
                  Emergency Hotline: +1 (555) 999-8888
                </p>
                <p className="text-sm text-muted-foreground">
                  Available 24/7 for urgent dorm-related emergencies
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
