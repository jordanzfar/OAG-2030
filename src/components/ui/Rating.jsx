// src/components/ui/Rating.jsx

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const Rating = ({ onSubmit, conversationId }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) return;
        setIsSubmitting(true);
        try {
            await onSubmit({ rating, comment, conversationId });
            setIsSubmitted(true);
        } catch (error) {
            console.error("Error al enviar valoración:", error);
            // Aquí se podría mostrar un toast de error si se pasa la función toast como prop
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center text-center p-4 my-4 bg-secondary/50 rounded-lg"
            >
                <CheckCircle className="w-12 h-12 text-green-500 mb-3" />
                <h3 className="font-semibold text-foreground">¡Gracias por tu valoración!</h3>
                <p className="text-sm text-muted-foreground">Tus comentarios nos ayudan a mejorar.</p>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="border-t border-dashed my-4 p-4 text-center bg-card rounded-lg shadow-sm"
        >
            <h3 className="font-semibold text-foreground mb-3">Valora nuestro servicio</h3>
            <div className="flex justify-center items-center space-x-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`h-8 w-8 cursor-pointer transition-colors ${
                            (hoverRating || rating) >= star ? 'text-yellow-400' : 'text-muted-foreground/50'
                        }`}
                        fill={(hoverRating || rating) >= star ? 'currentColor' : 'transparent'}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                    />
                ))}
            </div>
            <Textarea
                placeholder="Déjanos un comentario opcional..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="mb-4"
            />
            <Button onClick={handleSubmit} disabled={rating === 0 || isSubmitting}>
                {isSubmitting ? 'Enviando...' : 'Enviar Valoración'}
            </Button>
        </motion.div>
    );
};