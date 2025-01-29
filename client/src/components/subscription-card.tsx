import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Check } from "lucide-react";

interface SubscriptionCardProps {
  title: string;
  price: number;
  features: string[];
  highlighted?: boolean;
}

export default function SubscriptionCard({
  title,
  price,
  features,
  highlighted = false
}: SubscriptionCardProps) {
  return (
    <Card className={`${highlighted ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader>
        <CardTitle className="text-center">
          <div className="text-2xl font-bold">{title}</div>
          <div className="text-4xl font-bold mt-2">
            ${price}
            <span className="text-xl text-muted-foreground">/month</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2">
              <Check className="h-5 w-5 text-primary" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <Button className="w-full mt-6">
          {price === 0 ? 'Get Started' : 'Subscribe Now'}
        </Button>
      </CardContent>
    </Card>
  );
}