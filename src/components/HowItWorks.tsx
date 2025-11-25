import { FileText, Send, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: FileText,
    title: "Create Referral",
    description: "Healthcare provider initiates a secure referral with patient information and medical history",
    step: "01",
  },
  {
    icon: Send,
    title: "Instant Transfer",
    description: "Encrypted data is transmitted instantly to the receiving facility through secure channels",
    step: "02",
  },
  {
    icon: CheckCircle,
    title: "Confirm & Track",
    description: "Receiving facility confirms receipt and both parties track the patient's care journey",
    step: "03",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to secure patient referrals
          </p>
        </div>
        
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 relative">
            {steps.map((step, index) => (
              <div 
                key={index} 
                className="relative animate-slide-in"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="bg-card rounded-xl p-8 shadow-soft hover:shadow-medium transition-shadow duration-300 border border-border h-full">
                  <div className="flex items-start mb-6">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <step.icon className="h-8 w-8 text-primary" />
                    </div>
                    <span className="text-6xl font-bold text-primary/20 ml-auto">{step.step}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
                
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <div className="w-8 h-0.5 bg-primary/30" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
