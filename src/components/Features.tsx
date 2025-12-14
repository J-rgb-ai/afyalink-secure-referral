import { Shield, Zap, Network } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Shield,
    title: "Security First",
    description: "End-to-end encryption and HIPAA-compliant infrastructure ensure patient data remains confidential and protected at all times.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Real-time referral processing and instant notifications keep patient care moving without delays or bottlenecks.",
  },
  {
    icon: Network,
    title: "Seamless Integration",
    description: "Connect effortlessly with existing healthcare systems and EMRs for smooth data exchange across facilities.",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Why Choose AFYALINK?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Built for healthcare providers who demand security, speed, and simplicity
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="border-2 hover:border-primary transition-colors duration-300 bg-gradient-card shadow-soft hover:shadow-medium animate-fade-in"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <CardHeader>
                <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-2xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
