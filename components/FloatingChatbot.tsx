"use client";

import { useState } from "react";
import { MessageCircle, X, Send, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";

interface Message {
  role: "user" | "assistant" | "tool";
  content: string;
  toolName?: string;
  toolArgs?: any;
  products?: ProductInfo[];
}

interface ProductInfo {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  brand?: string;
  category?: string;
  description?: string;
  thumbnail?: string;
}

export default function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { addToCart, cart } = useCart();
  const [loadingProduct, setLoadingProduct] = useState<string | null>(null);

  const isInCart = (productId: string) => {
    return cart.items.some(item => item.product_id === productId);
  };

  const handleAddToCart = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    setLoadingProduct(productId);
    try {
      await addToCart(productId, 1);
    } finally {
      setLoadingProduct(null);
    }
  };

  // Parse product info from AI response
  const parseProducts = (text: string): ProductInfo[] => {
    const products: ProductInfo[] = [];
    
    // Match pattern: **Product Name** (ID: uuid)
    const productRegex = /\*\*([^*]+)\*\*\s*\(ID:\s*([a-f0-9-]+)\)/gi;
    const matches = [...text.matchAll(productRegex)];
    
    matches.forEach(match => {
      const title = match[1].trim();
      const id = match[2];
      
      // Find the section for this product
      const startIdx = match.index!;
      const nextMatch = matches[matches.indexOf(match) + 1];
      const endIdx = nextMatch ? nextMatch.index! : text.length;
      const section = text.substring(startIdx, endIdx);
      
      // Extract details
      const brandMatch = section.match(/Brand:\s*([^\n]+)/i);
      const priceMatch = section.match(/Price:\s*\$([0-9.]+)/i);
      const originalPriceMatch = section.match(/originally\s*\$([0-9.]+)/i);
      const discountMatch = section.match(/([0-9.]+)%\s*off/i);
      const descMatch = section.match(/Description:\s*([^\n]+)/i);
      
      products.push({
        id,
        title,
        price: priceMatch ? parseFloat(priceMatch[1]) : 0,
        originalPrice: originalPriceMatch ? parseFloat(originalPriceMatch[1]) : undefined,
        discount: discountMatch ? parseFloat(discountMatch[1]) : undefined,
        brand: brandMatch ? brandMatch[1].trim() : undefined,
        description: descMatch ? descMatch[1].trim() : undefined,
      });
    });
    
    return products;
  };

  // Send user message to backend
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { role: "user", content: input };

    // Add user message to UI
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // Call backend API with full message history
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMsg], // Send full conversation history
        }),
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Handle response - backend now returns a clean answer
      const aiText = data?.answer || "⚠️ No response from AI";

      // Parse products from response
      const products = parseProducts(aiText);

      const aiMsg: Message = {
        role: "assistant",
        content: aiText,
        products: products.length > 0 ? products : undefined,
      };

      // Add AI message to chat
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error: any) {
      const errorMsg: Message = {
        role: "assistant",
        content: `⚠️ Error: ${error.message || "Could not connect to AI"}`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-black hover:bg-gray-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-50"
          aria-label="Open AI Assistant"
        >
          <MessageCircle size={28} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
          {/* Header */}
          <div className="bg-black text-white p-4 rounded-t-lg flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MessageCircle size={24} />
              <h3 className="font-semibold">AI Shopping Assistant</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-gray-800 p-1 rounded transition-colors"
              aria-label="Close chat"
            >
              <X size={24} />
            </button>
          </div>

          {/* Messages section */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-8">
                <MessageCircle size={48} className="mx-auto mb-2 opacity-50" />
                <p>Hi! I'm your AI shopping assistant.</p>
                <p className="text-sm mt-2">Ask me anything about products!</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`mb-3 ${
                  msg.role === "user" ? "ml-auto" : "mr-auto"
                }`}
              >
                {/* Text message */}
                {msg.role === "user" && (
                  <div className="p-3 rounded-lg bg-black text-white max-w-[85%] ml-auto">
                    <p className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">{msg.content}</p>
                  </div>
                )}
                
                {/* AI message with potential product cards */}
                {msg.role === "assistant" && (
                  <div className="max-w-full">
                    {/* Show text response if no products or contains non-product text */}
                    {(!msg.products || msg.products.length === 0) && (
                      <div className="p-3 rounded-lg bg-white shadow-sm border border-gray-200 max-w-[85%]">
                        <p className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">{msg.content}</p>
                      </div>
                    )}
                    
                    {/* Show product cards if products exist */}
                    {msg.products && msg.products.length > 0 && (
                      <div className="space-y-3">
                        {/* Show intro text before products if exists */}
                        {msg.content.split('**')[0].trim() && (
                          <div className="p-3 rounded-lg bg-white shadow-sm border border-gray-200 max-w-[85%]">
                            <p className="text-sm">{msg.content.split('**')[0].trim()}</p>
                          </div>
                        )}
                        
                        {/* Product Cards */}
                        <div className="space-y-2">
                          {msg.products.map((product) => {
                            const inCart = isInCart(product.id);
                            const isLoading = loadingProduct === product.id;
                            
                            return (
                              <Link 
                                key={product.id} 
                                href={`/products/${product.id}`}
                                className="block"
                              >
                                <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer">
                                  <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <CardTitle className="text-sm line-clamp-2">{product.title}</CardTitle>
                                        {product.brand && (
                                          <p className="text-xs text-muted-foreground mt-1">{product.brand}</p>
                                        )}
                                      </div>
                                      {product.discount && product.discount > 0 && (
                                        <Badge variant="destructive" className="text-xs shrink-0">
                                          -{product.discount}%
                                        </Badge>
                                      )}
                                    </div>
                                  </CardHeader>
                                  
                                  <CardContent className="pb-2">
                                    {product.description && (
                                      <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
                                    )}
                                  </CardContent>
                                  
                                  <CardFooter className="pt-0 flex items-center justify-between">
                                    <div>
                                      <div className="text-lg font-bold">${product.price.toFixed(2)}</div>
                                      {product.originalPrice && product.originalPrice > product.price && (
                                        <div className="text-xs text-muted-foreground line-through">
                                          ${product.originalPrice.toFixed(2)}
                                        </div>
                                      )}
                                    </div>
                                    
                                    {inCart ? (
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          window.location.href = '/cart';
                                        }}
                                      >
                                        <ShoppingCart className="h-3 w-3 mr-1" />
                                        In Cart
                                      </Button>
                                    ) : (
                                      <Button 
                                        size="sm"
                                        onClick={(e) => handleAddToCart(e, product.id)}
                                        disabled={isLoading}
                                      >
                                        {isLoading ? 'Adding...' : 'Add to Cart'}
                                      </Button>
                                    )}
                                  </CardFooter>
                                </Card>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="mb-3 p-3 rounded-lg max-w-[85%] bg-white shadow-sm border border-gray-200 mr-auto">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                </div>
              </div>
            )}
          </div>

          {/* Input section */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
            <div className="flex gap-2">
              <input
                className="flex-1 border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Ask about products..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !isLoading && sendMessage()}
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Send message"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
