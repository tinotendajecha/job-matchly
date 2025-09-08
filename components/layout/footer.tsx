'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-semibold mb-4">JobMatchly</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md">
              AI-powered resume builder that tailors your CV to each job and passes ATS checks. 
              Land your next role with confidence.
            </p>
            <motion.div 
              className="flex items-center gap-1 text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Made with <Heart className="h-4 w-4 text-red-500 mx-1" /> by Gen Z Tech Labs
            </motion.div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/templates" className="hover:text-foreground transition-colors">Templates</Link></li>
              <li><Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
              <li><Link href="/app/coming-soon" className="hover:text-foreground transition-colors">Roadmap</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link></li>
              <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link></li>
              <li><Link href="/auth/signin" className="hover:text-foreground transition-colors">Sign In</Link></li>
              <li><Link href="/auth/signup" className="hover:text-foreground transition-colors">Sign Up</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; 2025 JobMatchly. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}