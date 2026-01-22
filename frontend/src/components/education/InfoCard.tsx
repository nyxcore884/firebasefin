import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Info } from "lucide-react";

interface InfoCardProps {
    title: string;
    description: string;
    content: string;
    icon?: React.ReactNode;
}

export const InfoCard = ({ title, description, content, icon }: InfoCardProps) => {
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                    {icon || <BookOpen className="h-5 w-5 text-primary" />}
                    {title}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                    {content}
                </p>
                <Button variant="outline" size="sm" className="w-full">
                    <Info className="mr-2 h-4 w-4" /> Learn More
                </Button>
            </CardContent>
        </Card>
    );
};
