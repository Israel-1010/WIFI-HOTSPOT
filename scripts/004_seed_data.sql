-- Insert sample admin user (this will be created when the first admin signs up)
-- The trigger will handle profile creation automatically

-- Insert sample campaigns
INSERT INTO public.campaigns (name, description, type, status, modal_position, content, settings) VALUES
('Campanha de Boas-vindas', 'Campanha para novos usuários', 'popup', 'active', 'center', 
 '{"title": "Bem-vindo!", "message": "Aproveite nossa oferta especial!", "button_text": "Ver Ofertas"}',
 '{"show_delay": 3000, "auto_close": false}'),
('Banner Promocional', 'Banner para promoções sazonais', 'banner', 'active', 'top',
 '{"title": "Promoção Especial", "message": "50% de desconto em produtos selecionados", "button_text": "Comprar Agora"}',
 '{"background_color": "#ff6b6b", "text_color": "#ffffff"}'),
('Pesquisa de Satisfação', 'Campanha para coletar feedback', 'popup', 'active', 'center',
 '{"title": "Sua opinião importa", "message": "Responda nossa pesquisa rápida", "button_text": "Participar"}',
 '{"show_after_purchase": true}');

-- Insert sample vouchers
INSERT INTO public.vouchers (code, title, description, discount_type, discount_value, max_uses, expires_at, campaign_id) VALUES
('WELCOME10', 'Desconto de Boas-vindas', '10% de desconto na primeira compra', 'percentage', 10.00, 100, NOW() + INTERVAL '30 days', 
 (SELECT id FROM public.campaigns WHERE name = 'Campanha de Boas-vindas' LIMIT 1)),
('SAVE50', 'Desconto Especial', 'R$ 50 de desconto em compras acima de R$ 200', 'fixed', 50.00, 50, NOW() + INTERVAL '15 days',
 (SELECT id FROM public.campaigns WHERE name = 'Banner Promocional' LIMIT 1));

-- Insert sample surveys
INSERT INTO public.surveys (title, description, questions, status, campaign_id) VALUES
('Pesquisa de Satisfação do Cliente', 'Avalie sua experiência conosco', 
 '[
   {"id": 1, "type": "rating", "question": "Como você avalia nosso atendimento?", "required": true, "scale": 5},
   {"id": 2, "type": "multiple_choice", "question": "Qual produto você mais gosta?", "options": ["Produto A", "Produto B", "Produto C"], "required": true},
   {"id": 3, "type": "text", "question": "Deixe seus comentários", "required": false}
 ]', 'active',
 (SELECT id FROM public.campaigns WHERE name = 'Pesquisa de Satisfação' LIMIT 1));

-- Insert sample gamification
INSERT INTO public.gamification (name, type, description, rules, rewards, campaign_id) VALUES
('Sistema de Pontos', 'points', 'Ganhe pontos a cada compra', 
 '{"points_per_real": 1, "bonus_threshold": 100}',
 '{"100_points": "Desconto de 5%", "500_points": "Frete grátis", "1000_points": "Produto grátis"}',
 (SELECT id FROM public.campaigns WHERE name = 'Campanha de Boas-vindas' LIMIT 1)),
('Desafio Mensal', 'challenges', 'Complete desafios e ganhe recompensas',
 '{"monthly_purchase_goal": 3, "referral_goal": 2}',
 '{"challenge_complete": "Voucher de R$ 25"}',
 (SELECT id FROM public.campaigns WHERE name = 'Banner Promocional' LIMIT 1));
