# .aidigestignore

```
node_modules/
package-lock.json
```

# .dockerignore

```
.git
.gitignore
node_modules
.next
.env*
.dockerignore
Dockerfile*
docker-compose*
README.md
```

# .gitignore

```
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.*
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/versions

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# env files (can opt-in for committing if needed)
.env*

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

```

# app/api/comparisons/route.ts

```ts
// app/api/comparisons/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    console.log('Fetching comparisons...');
    // Once we confirm the route works, we'll uncomment this:
    const comparisons = await prisma.groupedComparisons();
    return NextResponse.json(comparisons);
  } catch (error) {
    console.error('Error fetching comparisons:', error);
    return NextResponse.json(
      { error: 'Error fetching comparisons' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { item1, item2, response } = await request.json();

    console.log('Received comparison:', { item1, item2, response });

    const comparison = await prisma.comparison.create({
      data: {
        item1,
        item2,
        response: response === 'yes',
        timestamp: new Date(),
      },
    });
    return NextResponse.json(comparison);
  } catch (error) {
    console.error('Error creating comparison:', error);
    return NextResponse.json(
      { error: 'Error creating comparison' },
      { status: 500 }
    );
  }
}
```

# app/components/BakedGoodsGame.tsx

```tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const GraphVisualization = ({ comparisonStats, items }) => {
  const [nodePositions, setNodePositions] = useState({});

  useEffect(() => {
    // Calculate node positions in a circle
    const radius = 180;
    const center = { x: 250, y: 250 };
    const positions = {};

    items.forEach((item, index) => {
      const angle = (index / items.length) * 2 * Math.PI;
      positions[item] = {
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle)
      };
    });

    setNodePositions(positions);
  }, [items]);

  const getNetYesResponses = (item1, item2) => {
    const key = `${item1}-${item2}`;
    const stats = comparisonStats[key] || { yes: 0, no: 0 };
    return stats.yes - stats.no;
  };

  const getEdges = () => {
    const edges = [];
    items.forEach((item1) => {
      items.forEach((item2) => {
        if (item1 !== item2) {
          const netYes = getNetYesResponses(item1, item2);
          if (netYes > 0) {
            edges.push({
              source: item2,
              target: item1,
              weight: netYes
            });
          }
        }
      });
    });
    return edges;
  };

  const getArrowPoints = (x1, y1, x2, y2, nodeRadius = 20) => {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const endX = x2 - (nodeRadius * Math.cos(angle));
    const endY = y2 - (nodeRadius * Math.sin(angle));
    const arrowLength = 10;
    const arrowAngle = Math.PI / 6;

    const point1X = endX - arrowLength * Math.cos(angle - arrowAngle);
    const point1Y = endY - arrowLength * Math.sin(angle - arrowAngle);
    const point2X = endX - arrowLength * Math.cos(angle + arrowAngle);
    const point2Y = endY - arrowLength * Math.sin(angle + arrowAngle);

    return {
      end: { x: endX, y: endY },
      arrowPoints: [
        { x: point1X, y: point1Y },
        { x: endX, y: endY },
        { x: point2X, y: point2Y }
      ]
    };
  };

  if (!Object.keys(nodePositions).length) return null;

  return (
    <svg width="500" height="500" className="mx-auto">
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
        </marker>
      </defs>

      {getEdges().map((edge, i) => {
        const sourcePos = nodePositions[edge.source];
        const targetPos = nodePositions[edge.target];
        const strokeWidth = Math.min(edge.weight + 1, 5);
        const arrow = getArrowPoints(
          sourcePos.x,
          sourcePos.y,
          targetPos.x,
          targetPos.y
        );

        return (
          <g key={i}>
            <line
              x1={sourcePos.x}
              y1={sourcePos.y}
              x2={arrow.end.x}
              y2={arrow.end.y}
              stroke="#666"
              strokeWidth={strokeWidth}
              opacity={0.5}
              markerEnd="url(#arrowhead)"
            />
          </g>
        );
      })}

      {items.map((item) => {
        const pos = nodePositions[item];
        return (
          <g key={item}>
            <circle
              cx={pos.x}
              cy={pos.y}
              r="20"
              fill="white"
              stroke="#333"
              strokeWidth="2"
            />
            <text
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="12"
            >
              {item}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
  </div>
);

const BakedGoodsGame = () => {
  const bakedGoods = [
    'bread',
    'cake',
    'cookie',
    'pastry',
    'pie',
    'roll',
    'muffin',
    'donut',
    'brownie',
    'biscuit',
    'scone',
    'cracker',
    'tortilla',
    'crepe',
    'pancake',
    'waffle',
    'pita'
  ];

  const [item1, setItem1] = useState('');
  const [item2, setItem2] = useState('');
  const [showNext, setShowNext] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [comparisonStats, setComparisonStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getRandomQuestion = () => {
    let first, second;
    do {
      first = bakedGoods[Math.floor(Math.random() * bakedGoods.length)];
      second = bakedGoods[Math.floor(Math.random() * bakedGoods.length)];
    } while (first === second);

    setItem1(first);
    setItem2(second);
    setShowNext(false);
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/comparisons');
      if (!response.ok) throw new Error('Failed to fetch comparison data');
      const data = await response.json();
      setComparisonStats(data);
    } catch (err) {
      setError('Failed to load comparison data. Please try again later.');
      console.error('Error fetching stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    getRandomQuestion();
  }, []);

  const handleAnswer = async (answer) => {
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/comparisons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item1,
          item2,
          response: answer === 'yes',
        }),
      });

      if (!response.ok) throw new Error('Failed to submit answer');

      // Fetch updated stats after successful submission
      await fetchStats();
      setShowNext(true);
    } catch (err) {
      setError('Failed to submit answer. Please try again.');
      console.error('Error submitting answer:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCurrentStats = () => {
    const key = `${item1}-${item2}`;
    return comparisonStats[key] || { yes: 0, no: 0 };
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-xl mx-auto p-6">
        <CardContent>
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  if (showStats) {
    return (
      <Card className="w-full max-w-4xl mx-auto p-6">
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center">
              <Button
                onClick={() => setShowStats(false)}
                variant="ghost"
                className="mr-4"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Game
              </Button>
              <h2 className="text-2xl font-bold">Relationship Graph</h2>
            </div>

            <p className="text-gray-600">
              This graph shows hierarchical relationships between baked goods based on user answers.
              Arrows point from parent categories to their subtypes (e.g., if users say "a cookie is a type of pastry",
              an arrow points from pastry → cookie). Thicker arrows indicate stronger relationships.
            </p>

            <GraphVisualization
              comparisonStats={comparisonStats}
              items={bakedGoods}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-xl mx-auto p-6">
      <CardContent>
        <div className="space-y-6">
          <div className="text-center">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Baked Goods Comparison</h2>
              <Button
                onClick={() => setShowStats(true)}
                variant="outline"
              >
                View Stats Graph
              </Button>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <p className="text-xl mb-6">
              Is a <span className="font-bold text-blue-600">{item1}</span> a type of{' '}
              <span className="font-bold text-green-600">{item2}</span>?
            </p>
          </div>

          <div className="flex justify-center gap-4">
            <Button
              onClick={() => handleAnswer('yes')}
              disabled={showNext || isSubmitting}
              className="bg-green-500 hover:bg-green-600"
            >
              Yes
            </Button>
            <Button
              onClick={() => handleAnswer('no')}
              disabled={showNext || isSubmitting}
              className="bg-red-500 hover:bg-red-600"
            >
              No
            </Button>
          </div>

          {showNext && (
            <div className="space-y-4">
              <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">
                  How others answered "{item1} - {item2}":
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="font-medium">Yes Answers</p>
                    <p className="text-2xl text-green-600">{getCurrentStats().yes}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">No Answers</p>
                    <p className="text-2xl text-red-600">{getCurrentStats().no}</p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <Button
                  onClick={getRandomQuestion}
                  className="mt-4 bg-blue-500 hover:bg-blue-600"
                >
                  Next Question
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BakedGoodsGame;
```

# app/favicon.ico

This is a binary file of the type: Binary

# app/globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: Arial, Helvetica, sans-serif;
}

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
    --radius: 0.5rem;
  }
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

```

# app/layout.tsx

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

```

# app/page.tsx

```tsx
import BakedGoodsGame from './components/BakedGoodsGame'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <BakedGoodsGame />
    </main>
  )
}
```

# components.json

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

# components/ui/alert.tsx

```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }

```

# components/ui/button.tsx

```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

```

# components/ui/card.tsx

```tsx
import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }

```

# docker-compose.yml

```yml
version: '3.8'

services:
  db:
    image: postgres:14
    restart: always
    ports:
      - '5432:5432'
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: baked_goods_db
    volumes:
      - db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    volumes:
      - .:/app
      - /app/node_modules
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/baked_goods_db
    depends_on:
      db:
        condition: service_healthy
    command: npm run dev

  # Since we're using Next.js App Router with API routes,
  # we actually don't need a separate backend service!
  # The API routes will be served from the frontend service.

volumes:
  db-data:
```

# Dockerfile

```
FROM node:20-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Prisma setup
COPY prisma ./prisma/
RUN npx prisma generate

# Copy the rest of the code
COPY . .

# Expose the port
EXPOSE 3000

# Start in development mode
CMD ["npm", "run", "dev"]
```

# eslint.config.mjs

```mjs
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;

```

# lib/prisma.ts

```ts
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient().$extends({
    model: {
      comparison: {
        async groupedComparisons() {
          const results = await prisma.comparison.groupBy({
            by: ['item1', 'item2', 'response'],
            _count: true,
          });

          // Transform the results into the format expected by the frontend
          const comparisons = {};

          results.forEach((result) => {
            const key = `${result.item1}-${result.item2}`;
            if (!comparisons[key]) {
              comparisons[key] = { yes: 0, no: 0 };
            }

            if (result.response) {
              comparisons[key].yes = result._count;
            } else {
              comparisons[key].no = result._count;
            }
          });

          return comparisons;
        },
      },
    },
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
```

# lib/utils.ts

```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

```

# next-env.d.ts

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.

```

# next.config.ts

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

```

# package.json

```json
{
  "name": "baked-goods-classifier",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@prisma/client": "^6.1.0",
    "@radix-ui/react-slot": "^1.1.1",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.469.0",
    "next": "15.1.3",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "recharts": "^2.15.0",
    "tailwind-merge": "^2.6.0",
    "tailwindcss-animate": "^1.0.7"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "15.1.3",
    "postcss": "^8",
    "prisma": "^6.1.0",
    "tailwindcss": "^3.4.1",
    "typescript": "^5"
  }
}

```

# postcss.config.mjs

```mjs
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
  },
};

export default config;

```

# prisma/schema.prisma

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

// Looking for ways to speed up your queries, or scale easily with your serverless or edge functions?
// Try Prisma Accelerate: https://pris.ly/cli/accelerate-init

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Comparison {
  id        Int      @id @default(autoincrement())
  item1     String
  item2     String
  response  Boolean  // true for "yes", false for "no"
  timestamp DateTime @default(now())
  fingerprint String

  @@index([item1, item2])
}

```

# public/file.svg

This is a file of the type: SVG Image

# public/globe.svg

This is a file of the type: SVG Image

# public/next.svg

This is a file of the type: SVG Image

# public/vercel.svg

This is a file of the type: SVG Image

# public/window.svg

This is a file of the type: SVG Image

# README.md

```md
# BakedGoods

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

\`\`\`bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


```

# tailwind.config.ts

```ts
import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

```

# tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}

```

