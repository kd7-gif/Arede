-- Sample data. Every price, stock level and description here is a placeholder:
-- replace them from the admin panel (/admin) once the site is running.
-- image_url is NULL on purpose so the site shows its built-in placeholder art.

INSERT INTO categories (name, slug, description, sort_order) VALUES
  ('Cookware',    'cookware',    'Non-stick pots, pans and casseroles',        1),
  ('Dinnerware',  'dinnerware',  'Ceramic plates, bowls and dinner sets',      2),
  ('Mugs & Cups', 'mugs-cups',   'Mugs, tea cups and saucers',                 3),
  ('Cutlery',     'cutlery',     'Gold and steel cutlery sets',                4),
  ('Appliances',  'appliances',  'Kettles, blenders, air fryers and more',     5),
  ('Gift Sets',   'gift-sets',   'Ready to give, beautifully paired',          6);

INSERT INTO products (category_id, name, slug, description, price, compare_at_price, stock, is_featured) VALUES
  (1, 'Emerald Non-Stick Pot Set, 12 piece',      'emerald-non-stick-pot-set-12-piece',
      'A full set of non-stick pots with tempered glass lids and gold-tone handles. Even heating, easy to clean, and handsome enough to serve from.',
      185000.00, NULL, 8, 1),
  (1, 'Granite Non-Stick Frying Pan, 28cm',       'granite-non-stick-frying-pan-28cm',
      'Speckled granite coating with a wood-effect handle. Works on gas, electric and induction hobs.',
      24500.00, NULL, 25, 1),
  (1, 'Cream and Gold Casserole with Glass Lid',  'cream-and-gold-casserole-glass-lid',
      'Cream enamel finish with a gold Greek-key band. Roomy enough for a family pot of stew.',
      48000.00, NULL, 12, 0),

  (2, 'Ribbed Emerald Dinner Set, 24 piece',      'ribbed-emerald-dinner-set-24-piece',
      'Deep green ceramic with a ribbed finish and fine gold edge. Plates, side plates, bowls and mugs for six.',
      72000.00, NULL, 10, 1),
  (2, 'Gold Rim Ceramic Plates, set of 6',        'gold-rim-ceramic-plates-set-of-6',
      'Dinner plates with a hand-finished gold rim. Dishwasher safe.',
      29500.00, NULL, 20, 1),
  (2, 'Emerald Serving Bowl Set, 3 piece',        'emerald-serving-bowl-set-3-piece',
      'Three nesting bowls in graduated sizes for salads, rice and sides.',
      21000.00, NULL, 16, 0),

  (3, 'Emerald and Gold Mug Tree Set, 6 mugs',    'emerald-gold-mug-tree-set-6-mugs',
      'Six gloss green mugs with gold rims on a standing gold-tone mug tree.',
      26500.00, NULL, 14, 1),
  (3, 'Gold Rim Tea Cup and Saucer, set of 4',    'gold-rim-tea-cup-saucer-set-of-4',
      'Fine ceramic cups with matching saucers and a Greek-key gold border.',
      18000.00, NULL, 18, 0),
  (3, 'Everyday Ceramic Mug',                     'everyday-ceramic-mug',
      'A single gloss mug with a comfortable handle. Pick up a few.',
      4500.00, NULL, 60, 0),

  (4, 'Gold Cutlery Set with Stand, 24 piece',    'gold-cutlery-set-stand-24-piece',
      'Mirror-finish gold cutlery for six, with a matching stand for the table or counter.',
      38000.00, NULL, 15, 1),
  (4, 'Gold Steak Knife and Fork Set, 12 piece',  'gold-steak-knife-fork-set-12-piece',
      'Six knives and six forks with serrated blades that stay sharp.',
      22000.00, NULL, 20, 0),
  (4, 'Gold Dessert Spoon Set, 12 piece',         'gold-dessert-spoon-set-12-piece',
      'Twelve dessert spoons in a polished gold finish.',
      9500.00, NULL, 30, 0),

  (5, 'Electric Kettle, 1.8L',                    'electric-kettle-1-8l',
      'Auto shut-off, boil-dry protection and a cordless base.',
      16500.00, NULL, 22, 0),
  (5, 'Air Fryer, 5L',                            'air-fryer-5l',
      'Digital controls, preset programs and a removable non-stick basket.',
      78000.00, NULL, 9, 1),
  (5, 'Stand Blender, 1.5L',                      'stand-blender-1-5l',
      'Stainless steel blades and a glass jug for smoothies, soups and pepper mix.',
      35000.00, NULL, 13, 0),

  (6, 'Host''s Gift Box: Mug, Saucer and Spoon',  'hosts-gift-box-mug-saucer-spoon',
      'A mug, saucer and gold spoon packed in a gift box. A thoughtful thank-you.',
      14500.00, NULL, 24, 0),
  (6, 'Bridal Kitchen Starter Set',               'bridal-kitchen-starter-set',
      'Pot set, dinner set, cutlery and mugs, boxed together to start a new home well.',
      265000.00, NULL, 4, 1),
  (6, 'Tea Time Gift Set',                        'tea-time-gift-set',
      'Teapot, two cups and saucers, and a gold spoon pair in a presentation box.',
      32000.00, NULL, 11, 0);
