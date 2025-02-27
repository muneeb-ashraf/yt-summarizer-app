import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Check, Loader2 } from "lucide-react";

interface SubscriptionCardProps {
  title: string;
  price: number;
  features: string[];
  highlighted?: boolean;
  action?: () => void;
  buttonDisabled?: boolean;
  isLoading?: boolean;
  showSubscribeButton?: boolean;
  currentPlan?: string;
  buttonText?: string;
}

export default function SubscriptionCard({
  title,
  price,
  features,
  highlighted = false,
  action,
  buttonDisabled = false,
  isLoading = false,
  showSubscribeButton = true,
  currentPlan,
  buttonText
}: SubscriptionCardProps) {
  const isCurrentPlan = currentPlan === title.toLowerCase();

  return (
    <Card className={`${highlighted ? 'ring-2 ring-primary' : ''} flex flex-col`}>
      <CardHeader>
        <CardTitle className="text-center">
          <div className="text-xl md:text-2xl font-bold">{title}</div>
          <div className="text-3xl md:text-4xl font-bold mt-2">
            ${price}
            <span className="text-lg md:text-xl text-muted-foreground">/month</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <ul className="space-y-3 mb-6 flex-1">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-sm md:text-base">{feature}</span>
            </li>
          ))}
        </ul>
        {showSubscribeButton && (
          <Button 
            className="w-full mt-auto"
            onClick={action}
            disabled={buttonDisabled || isCurrentPlan}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : buttonText || (isCurrentPlan ? 'Current Plan' : 'Subscribe')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}