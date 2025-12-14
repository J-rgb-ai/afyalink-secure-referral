import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Search, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

/* Static FAQ Data */
const FAQ_DATA: FAQ[] = [
  {
    id: "1",
    question: "What is AfyaLink?",
    answer: "AfyaLink is a digital health platform designed to connect patients with healthcare providers, health resources, and essential medical services in a simple, secure, and accessible way.",
    category: "general"
  },
  {
    id: "2",
    question: "Who is AfyaLink for?",
    answer: "AfyaLink is for patients, healthcare providers (doctors, nurses, clinics), and health organizations seeking an efficient way to communicate, manage health information, and improve access to care.",
    category: "general"
  },
  {
    id: "3",
    question: "What problems does AfyaLink solve?",
    answer: "AfyaLink addresses challenges such as limited access to healthcare information, poor patient–provider communication, delayed medical support, and fragmented health records.",
    category: "general"
  },
  {
    id: "4",
    question: "What services does AfyaLink offer?",
    answer: "AfyaLink offers features such as patient profiles, appointment scheduling, health information access, secure communication with healthcare providers, and digital health record management.",
    category: "services"
  },
  {
    id: "5",
    question: "Is AfyaLink available on mobile devices?",
    answer: "Yes. AfyaLink is designed to be mobile-friendly and accessible on smartphones, tablets, and web browsers to ensure ease of use for all users.",
    category: "technical"
  },
  {
    id: "6",
    question: "How secure is AfyaLink?",
    answer: "AfyaLink prioritizes data privacy and security. User data is protected through secure authentication, encryption, and strict access control in compliance with healthcare data protection standards.",
    category: "security"
  },
  {
    id: "7",
    question: "Do I need internet access to use AfyaLink?",
    answer: "Basic functionality requires internet access. However, AfyaLink aims to support low-bandwidth environments and alternative access methods where possible.",
    category: "technical"
  },
  {
    id: "8",
    question: "Is AfyaLink free to use?",
    answer: "AfyaLink offers core features for free. Some advanced services may be available through partnerships or premium plans, depending on user needs.",
    category: "general"
  },
  {
    id: "9",
    question: "Can healthcare providers join AfyaLink?",
    answer: "Yes. Healthcare providers can register on AfyaLink to manage patient interactions, appointments, and medical information more efficiently.",
    category: "providers"
  },
  {
    id: "10",
    question: "How do I register on AfyaLink?",
    answer: "Users can register by creating an account using their basic details through the AfyaLink platform and completing the required verification steps.",
    category: "account"
  },
  {
    id: "11",
    question: "Can AfyaLink be used in rural or underserved areas?",
    answer: "Yes. AfyaLink is built with inclusivity in mind and aims to support users in both urban and rural areas by optimizing performance and accessibility.",
    category: "general"
  },
  {
    id: "12",
    question: "Who manages and maintains AfyaLink?",
    answer: "AfyaLink is managed by a dedicated development and health innovation team focused on improving healthcare access through technology.",
    category: "general"
  },
  {
    id: "13",
    question: "How can I get support if I face issues using AfyaLink?",
    answer: "Users can access support through the help center, in-app support options, or by contacting the AfyaLink support team.",
    category: "support"
  },
  {
    id: "14",
    question: "Is AfyaLink compliant with healthcare regulations?",
    answer: "Yes. AfyaLink is designed to align with relevant healthcare and data protection regulations to ensure ethical and legal use.",
    category: "security"
  },
  {
    id: "15",
    question: "How can organizations partner with AfyaLink?",
    answer: "Organizations interested in partnering with AfyaLink can reach out through the official contact channels to explore collaboration opportunities.",
    category: "partnerships"
  }
];

const FAQ = () => {
  const navigate = useNavigate();
  const [filteredFaqs, setFilteredFaqs] = useState<FAQ[]>(FAQ_DATA);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    filterFAQs();
  }, [searchQuery, selectedCategory]);

  const filterFAQs = () => {
    let filtered = FAQ_DATA;

    if (selectedCategory !== "all") {
      filtered = filtered.filter((faq) => faq.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredFaqs(filtered);
  };

  const categories = ["all", ...new Set(FAQ_DATA.map((faq) => faq.category))];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <Heart className="text-primary" size={32} />
                <span className="text-2xl font-bold text-foreground">AFYALINK</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-muted-foreground text-lg">
            Find answers to common questions about AFYALINK e-Referral System
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
            <Input
              type="text"
              placeholder="Search for questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              className="capitalize"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* FAQs */}
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No FAQs found matching your search.</p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
            {filteredFaqs.map((faq) => (
              <AccordionItem
                key={faq.id}
                value={faq.id}
                className="bg-card border border-border rounded-lg px-6"
              >
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="font-semibold text-foreground">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}

        {/* Contact Support */}
        <div className="mt-12 p-6 bg-primary/10 rounded-lg text-center">
          <h3 className="text-xl font-bold text-foreground mb-2">
            Still have questions?
          </h3>
          <p className="text-muted-foreground mb-4">
            Can't find what you're looking for? Contact our support team.
          </p>
          <Button onClick={() => navigate("/feedback")}>
            Submit Feedback
          </Button>
        </div>
      </main>
    </div>
  );
};

export default FAQ;
