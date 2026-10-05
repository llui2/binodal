interface Env {
  DB: D1Database;
  ORCID_CLIENT_ID: string;
  ORCID_CLIENT_SECRET: string;
  ORCID_REDIRECT_URI?: string;
  ORCID_BASE_URL?: string;
}

interface Paper {
  arxiv_id: string;
  title: string;
  authors_json: string;
  abstract: string;
  published_at: string | null;
  updated_at: string | null;
}

type PaperIdentifierType = "arxiv" | "doi" | "url";

interface PaperIdentifier {
  type: PaperIdentifierType;
  value: string;
  paper_id?: string;
  label: string | null;
  url: string;
}

interface FetchedPaper {
  paper: Paper;
  identifiers: PaperIdentifier[];
}

interface User {
  id: number;
  orcid: string;
  display_name: string;
}

interface CommentRow {
  id: number;
  paper_id: string;
  user_id: number;
  parent_id: number | null;
  body: string;
  created_at: string;
  display_name: string;
  orcid: string;
}

const TRAILS_LOGO_SVG = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 648 498\" width=\"648\" height=\"498\">\n  <title>Trails logo mark</title>\n  <path d=\"M 638 26 L 637 25 L 637 24 L 635 22 L 634 19 L 632 17 L 631 17 L 630 16 L 630 15 L 628 13 L 627 13 L 626 12 L 624 12 L 622 10 L 620 10 L 619 9 L 617 9 L 616 8 L 609 8 L 608 9 L 605 9 L 604 10 L 601 10 L 600 11 L 599 11 L 597 13 L 596 13 L 591 18 L 590 18 L 590 19 L 587 22 L 586 22 L 583 25 L 581 25 L 580 26 L 579 26 L 577 28 L 572 28 L 567 31 L 564 31 L 563 32 L 561 32 L 560 33 L 558 33 L 557 34 L 554 34 L 553 35 L 550 35 L 549 36 L 547 36 L 546 37 L 544 37 L 542 40 L 541 40 L 538 42 L 536 42 L 535 43 L 533 43 L 532 42 L 529 42 L 527 44 L 526 44 L 525 45 L 525 46 L 524 47 L 523 47 L 521 49 L 520 49 L 515 52 L 513 52 L 512 53 L 509 54 L 507 56 L 505 56 L 502 59 L 501 59 L 500 60 L 499 59 L 498 60 L 497 60 L 494 63 L 493 63 L 489 67 L 488 67 L 482 73 L 482 74 L 480 76 L 480 77 L 474 84 L 473 87 L 471 89 L 471 90 L 469 92 L 469 93 L 467 95 L 467 96 L 464 99 L 464 100 L 458 106 L 458 107 L 456 109 L 455 109 L 453 111 L 452 111 L 448 115 L 447 115 L 445 117 L 444 117 L 443 118 L 442 118 L 441 119 L 440 119 L 439 120 L 438 120 L 433 123 L 430 123 L 429 124 L 427 124 L 426 125 L 420 125 L 419 126 L 412 126 L 411 127 L 398 127 L 397 126 L 380 126 L 379 125 L 378 126 L 373 126 L 372 125 L 357 125 L 356 124 L 346 124 L 345 123 L 329 123 L 328 124 L 326 124 L 324 122 L 321 122 L 320 121 L 316 121 L 315 120 L 308 120 L 307 119 L 302 119 L 302 120 L 301 121 L 297 121 L 296 120 L 291 120 L 290 119 L 287 119 L 286 118 L 283 118 L 282 117 L 278 117 L 277 116 L 273 116 L 272 115 L 269 115 L 268 114 L 266 114 L 265 113 L 261 113 L 260 112 L 254 112 L 253 111 L 250 111 L 249 110 L 246 110 L 245 109 L 241 109 L 240 108 L 237 108 L 236 107 L 233 107 L 232 106 L 231 107 L 230 107 L 229 106 L 224 106 L 223 105 L 221 105 L 220 104 L 207 104 L 204 107 L 203 106 L 203 105 L 204 104 L 204 103 L 203 102 L 199 102 L 198 103 L 197 102 L 192 102 L 192 103 L 191 104 L 190 104 L 189 103 L 189 102 L 184 102 L 183 103 L 182 103 L 181 102 L 180 102 L 179 103 L 178 103 L 177 102 L 176 102 L 175 103 L 174 102 L 168 102 L 167 103 L 164 103 L 165 103 L 166 104 L 166 105 L 165 106 L 162 106 L 161 107 L 149 107 L 148 108 L 147 108 L 146 107 L 145 108 L 143 108 L 142 107 L 143 106 L 143 105 L 138 105 L 137 106 L 135 106 L 135 107 L 136 108 L 135 109 L 134 109 L 133 110 L 131 110 L 130 111 L 127 111 L 126 112 L 123 112 L 122 113 L 118 113 L 117 114 L 110 114 L 109 113 L 109 112 L 108 112 L 107 113 L 104 113 L 103 114 L 101 114 L 100 115 L 98 115 L 97 116 L 94 116 L 91 118 L 89 118 L 89 120 L 88 121 L 87 121 L 84 123 L 82 123 L 81 124 L 80 124 L 79 123 L 77 123 L 74 125 L 73 125 L 72 124 L 71 125 L 68 125 L 67 126 L 65 126 L 64 127 L 56 127 L 55 128 L 46 128 L 45 127 L 41 127 L 40 126 L 31 126 L 30 127 L 27 127 L 26 128 L 24 128 L 23 129 L 22 129 L 19 132 L 18 132 L 17 133 L 17 134 L 15 136 L 15 137 L 12 140 L 12 141 L 10 144 L 10 146 L 9 147 L 9 151 L 8 152 L 8 157 L 9 158 L 9 161 L 10 162 L 10 163 L 11 164 L 12 167 L 18 173 L 19 173 L 20 174 L 22 174 L 23 175 L 25 175 L 26 176 L 30 176 L 31 177 L 34 177 L 35 176 L 39 176 L 40 175 L 42 175 L 43 174 L 46 173 L 48 171 L 49 171 L 54 166 L 54 165 L 56 163 L 56 162 L 57 161 L 57 160 L 60 155 L 61 155 L 65 151 L 66 151 L 73 145 L 75 145 L 76 144 L 77 144 L 79 142 L 79 140 L 78 139 L 78 138 L 80 136 L 81 136 L 84 134 L 85 134 L 86 135 L 86 136 L 84 138 L 82 138 L 82 140 L 83 140 L 84 139 L 86 139 L 87 138 L 88 138 L 89 137 L 92 136 L 92 135 L 91 135 L 90 134 L 90 133 L 91 132 L 93 132 L 96 130 L 97 130 L 98 131 L 98 132 L 97 133 L 97 134 L 98 134 L 99 133 L 102 133 L 103 132 L 105 132 L 106 131 L 108 131 L 109 130 L 109 127 L 111 125 L 114 125 L 115 124 L 118 124 L 121 122 L 130 122 L 131 121 L 135 121 L 136 122 L 135 123 L 133 123 L 132 124 L 130 124 L 127 126 L 124 126 L 123 127 L 128 127 L 129 126 L 135 126 L 136 125 L 151 125 L 152 124 L 157 124 L 158 125 L 164 125 L 165 126 L 173 126 L 174 127 L 181 127 L 182 126 L 184 128 L 187 128 L 190 130 L 194 130 L 195 131 L 197 131 L 198 132 L 202 132 L 203 133 L 204 133 L 205 132 L 207 134 L 210 134 L 212 136 L 214 136 L 215 137 L 216 137 L 219 139 L 221 139 L 222 140 L 225 140 L 227 142 L 228 142 L 233 145 L 235 145 L 237 147 L 238 147 L 239 148 L 240 148 L 241 149 L 242 149 L 243 150 L 246 151 L 249 154 L 250 154 L 252 156 L 253 156 L 255 158 L 256 158 L 258 160 L 259 160 L 262 163 L 263 163 L 265 165 L 266 165 L 267 166 L 267 167 L 269 169 L 270 169 L 271 170 L 271 171 L 272 172 L 273 172 L 275 174 L 275 175 L 277 177 L 278 177 L 279 178 L 279 179 L 283 183 L 283 185 L 286 188 L 286 189 L 288 191 L 288 192 L 291 195 L 292 198 L 295 201 L 295 202 L 296 203 L 296 204 L 298 206 L 298 207 L 303 212 L 303 213 L 305 215 L 305 216 L 313 224 L 314 224 L 316 226 L 317 226 L 319 228 L 319 229 L 324 234 L 327 235 L 330 238 L 331 238 L 334 241 L 337 242 L 339 244 L 345 246 L 348 249 L 349 249 L 350 250 L 352 250 L 353 251 L 354 251 L 357 253 L 359 253 L 362 255 L 365 255 L 366 256 L 367 256 L 368 257 L 370 257 L 373 259 L 375 259 L 376 260 L 379 260 L 380 261 L 381 261 L 384 263 L 386 263 L 388 265 L 389 265 L 390 266 L 391 266 L 392 267 L 393 267 L 394 268 L 397 269 L 401 273 L 402 273 L 412 283 L 412 284 L 414 286 L 414 287 L 418 292 L 418 293 L 420 296 L 420 298 L 422 301 L 422 303 L 423 304 L 423 306 L 424 307 L 424 315 L 425 316 L 425 325 L 428 325 L 429 326 L 429 328 L 428 329 L 427 329 L 425 327 L 425 328 L 424 329 L 424 332 L 423 333 L 423 337 L 422 338 L 422 343 L 422 342 L 424 340 L 425 340 L 426 341 L 426 342 L 425 343 L 425 345 L 424 346 L 421 346 L 420 347 L 420 350 L 419 351 L 418 351 L 418 354 L 416 356 L 416 359 L 414 361 L 414 362 L 413 363 L 413 365 L 411 368 L 411 370 L 410 371 L 410 372 L 412 372 L 414 370 L 414 369 L 416 366 L 416 363 L 417 362 L 417 360 L 419 358 L 418 357 L 418 356 L 419 355 L 420 355 L 420 351 L 423 349 L 424 346 L 426 344 L 426 342 L 427 341 L 427 340 L 426 339 L 428 337 L 430 339 L 430 343 L 429 344 L 429 349 L 428 350 L 430 352 L 429 353 L 429 357 L 428 358 L 429 359 L 429 360 L 428 361 L 427 364 L 426 365 L 425 365 L 424 364 L 424 363 L 422 363 L 420 365 L 420 366 L 419 367 L 418 367 L 418 368 L 417 369 L 417 371 L 419 371 L 420 372 L 419 373 L 419 375 L 418 376 L 418 379 L 416 382 L 416 388 L 415 389 L 415 394 L 414 395 L 414 397 L 412 400 L 412 403 L 411 404 L 411 407 L 410 408 L 409 408 L 407 406 L 405 406 L 405 409 L 404 410 L 405 411 L 405 418 L 406 419 L 406 422 L 407 423 L 407 425 L 410 430 L 410 432 L 412 434 L 412 435 L 416 440 L 417 443 L 423 449 L 423 450 L 426 453 L 426 455 L 427 456 L 427 457 L 429 459 L 429 460 L 431 463 L 431 465 L 432 466 L 432 468 L 433 469 L 433 471 L 434 472 L 434 475 L 435 476 L 436 479 L 438 481 L 439 481 L 443 486 L 444 486 L 445 487 L 447 487 L 448 488 L 451 488 L 452 489 L 462 489 L 463 488 L 465 488 L 466 487 L 469 487 L 471 485 L 472 485 L 477 480 L 478 480 L 480 478 L 480 477 L 483 472 L 483 468 L 484 467 L 484 461 L 483 460 L 483 456 L 482 455 L 482 454 L 481 453 L 480 450 L 473 443 L 472 443 L 467 440 L 465 440 L 464 439 L 460 439 L 459 438 L 449 438 L 448 437 L 446 437 L 445 436 L 442 435 L 439 432 L 437 432 L 435 430 L 435 429 L 431 425 L 431 424 L 429 422 L 428 419 L 426 417 L 426 415 L 424 412 L 424 408 L 423 407 L 423 402 L 422 401 L 422 393 L 423 392 L 423 388 L 424 387 L 424 384 L 423 383 L 421 383 L 420 382 L 422 380 L 421 379 L 421 376 L 420 375 L 421 374 L 421 372 L 423 369 L 424 370 L 424 373 L 425 373 L 428 370 L 428 369 L 430 366 L 430 363 L 431 362 L 431 361 L 432 360 L 433 357 L 435 355 L 435 354 L 438 349 L 438 347 L 440 344 L 440 343 L 439 342 L 441 340 L 441 337 L 442 336 L 442 333 L 443 332 L 443 329 L 444 328 L 444 322 L 445 321 L 445 318 L 444 317 L 444 306 L 443 305 L 443 302 L 442 301 L 442 297 L 441 296 L 441 294 L 440 293 L 440 291 L 439 290 L 438 287 L 436 285 L 436 282 L 433 279 L 432 276 L 429 273 L 429 272 L 423 266 L 423 265 L 420 262 L 419 262 L 418 261 L 418 260 L 417 260 L 414 257 L 413 257 L 410 254 L 409 254 L 407 252 L 406 252 L 405 251 L 402 250 L 400 248 L 399 248 L 396 246 L 394 246 L 389 243 L 387 243 L 386 242 L 384 242 L 379 239 L 375 239 L 374 238 L 372 238 L 369 236 L 367 236 L 366 235 L 363 235 L 361 233 L 359 233 L 358 232 L 357 232 L 352 229 L 350 229 L 345 225 L 342 224 L 339 221 L 337 221 L 336 220 L 336 219 L 333 216 L 332 216 L 330 214 L 330 213 L 328 211 L 327 211 L 323 207 L 323 206 L 319 202 L 319 201 L 317 199 L 317 198 L 315 196 L 314 196 L 313 195 L 313 193 L 312 192 L 312 190 L 308 186 L 308 185 L 307 184 L 307 182 L 303 177 L 302 174 L 299 171 L 299 170 L 298 169 L 297 166 L 292 161 L 292 160 L 291 159 L 291 158 L 289 156 L 289 155 L 283 149 L 283 148 L 279 144 L 279 143 L 278 142 L 278 140 L 277 139 L 277 137 L 281 133 L 283 133 L 284 132 L 285 133 L 287 133 L 288 132 L 297 132 L 298 131 L 300 131 L 301 132 L 308 132 L 311 130 L 313 130 L 314 131 L 316 131 L 319 133 L 325 133 L 326 134 L 329 134 L 330 135 L 334 135 L 335 136 L 340 136 L 341 137 L 346 137 L 347 138 L 354 138 L 355 139 L 357 139 L 358 140 L 362 140 L 363 141 L 371 141 L 372 142 L 377 142 L 378 143 L 382 143 L 383 144 L 392 144 L 393 145 L 397 145 L 398 146 L 400 146 L 401 147 L 413 147 L 414 148 L 423 148 L 424 147 L 427 147 L 428 146 L 432 146 L 433 145 L 435 145 L 436 144 L 439 144 L 440 143 L 442 143 L 443 142 L 444 142 L 445 141 L 446 141 L 447 140 L 450 139 L 452 137 L 453 137 L 455 135 L 456 135 L 467 124 L 467 123 L 470 120 L 470 119 L 472 117 L 473 114 L 475 112 L 475 111 L 477 108 L 477 106 L 478 105 L 478 104 L 481 99 L 481 97 L 482 96 L 482 94 L 483 93 L 483 92 L 484 91 L 484 90 L 485 89 L 486 86 L 490 81 L 490 79 L 491 78 L 491 77 L 495 73 L 495 72 L 499 68 L 500 68 L 501 67 L 501 66 L 503 64 L 503 63 L 508 58 L 511 57 L 514 54 L 515 54 L 516 53 L 518 53 L 519 52 L 521 52 L 522 51 L 526 51 L 527 50 L 531 50 L 532 49 L 534 49 L 537 47 L 545 47 L 546 46 L 549 46 L 550 45 L 552 45 L 553 46 L 562 46 L 563 47 L 571 47 L 572 48 L 575 48 L 576 49 L 579 49 L 582 51 L 584 51 L 585 52 L 587 52 L 588 53 L 589 53 L 595 59 L 596 59 L 599 61 L 601 61 L 602 62 L 604 62 L 605 63 L 617 63 L 618 62 L 621 62 L 622 61 L 623 61 L 625 59 L 626 59 L 628 57 L 629 57 L 633 53 L 633 52 L 634 51 L 635 48 L 637 46 L 637 44 L 638 43 L 638 41 L 639 40 L 639 31 L 638 30 Z M 427 447 L 428 446 L 429 447 L 429 448 L 428 449 L 427 448 Z M 423 439 L 424 438 L 425 438 L 427 440 L 426 441 L 425 441 Z M 424 422 L 425 423 L 425 426 L 424 427 L 423 426 L 423 423 Z M 413 417 L 414 417 L 416 419 L 416 421 L 417 422 L 417 423 L 418 424 L 418 425 L 421 430 L 421 432 L 422 433 L 422 434 L 424 436 L 424 437 L 423 438 L 421 438 L 419 440 L 417 440 L 416 439 L 416 436 L 417 435 L 418 435 L 417 435 L 416 434 L 416 429 L 415 429 L 414 428 L 414 426 L 413 425 L 411 425 L 410 424 L 410 423 L 413 421 L 413 420 L 412 419 L 412 418 Z M 412 415 L 413 414 L 414 415 L 413 416 Z M 411 413 L 412 414 L 412 416 L 411 417 L 410 417 L 409 416 L 409 415 Z M 406 408 L 407 407 L 408 408 L 407 409 Z M 418 406 L 419 405 L 420 406 L 419 407 Z M 432 334 L 433 333 L 434 334 L 433 335 Z M 440 332 L 441 333 L 441 335 L 438 338 L 437 338 L 436 337 L 437 336 L 437 333 L 438 332 Z M 436 321 L 437 322 L 437 324 L 435 326 L 434 325 L 434 322 L 435 321 Z M 434 308 L 435 307 L 436 308 L 436 309 L 435 310 L 434 309 Z M 428 308 L 428 307 L 429 306 L 430 306 L 431 307 L 429 309 Z M 430 304 L 431 303 L 432 304 L 431 305 Z M 288 183 L 288 182 L 289 181 L 290 181 L 291 182 L 289 184 Z M 30 151 L 31 150 L 32 151 L 31 152 Z M 243 136 L 244 135 L 245 135 L 247 137 L 246 138 L 245 138 Z M 29 135 L 30 136 L 30 137 L 28 139 L 27 138 L 27 137 Z M 233 134 L 234 133 L 235 134 L 234 135 Z M 266 133 L 267 132 L 269 132 L 270 133 L 272 133 L 273 134 L 274 134 L 275 135 L 275 136 L 273 138 L 272 138 L 271 137 L 270 137 L 268 135 L 267 135 L 266 134 Z M 28 133 L 29 132 L 30 133 L 30 134 L 29 135 L 28 134 Z M 240 134 L 242 132 L 243 132 L 244 131 L 245 131 L 246 132 L 246 134 L 245 135 L 241 135 Z M 204 131 L 205 130 L 206 131 L 205 132 Z M 214 125 L 215 124 L 216 124 L 217 125 L 216 126 L 215 126 Z M 237 124 L 238 123 L 240 123 L 241 124 L 242 124 L 244 126 L 243 127 L 239 127 L 237 125 Z M 210 124 L 211 123 L 214 123 L 215 124 L 214 125 L 211 125 Z M 200 124 L 201 123 L 202 124 L 201 125 Z M 96 124 L 97 123 L 98 124 L 97 125 Z M 297 123 L 298 122 L 300 124 L 299 125 L 298 125 L 297 124 Z M 294 123 L 295 122 L 296 123 L 295 124 Z M 201 123 L 202 122 L 203 123 L 202 124 Z M 180 123 L 181 122 L 184 122 L 185 123 L 185 124 L 184 125 L 181 125 L 180 124 Z M 227 121 L 228 122 L 228 123 L 226 125 L 224 125 L 223 124 L 224 123 L 225 123 Z M 137 122 L 138 121 L 139 122 L 138 123 Z M 100 122 L 101 121 L 102 121 L 103 122 L 102 123 L 101 123 Z M 162 120 L 163 119 L 164 120 L 164 121 L 163 122 L 162 121 Z M 150 120 L 151 119 L 152 120 L 151 121 Z M 113 119 L 114 118 L 115 119 L 114 120 Z M 220 118 L 221 117 L 222 118 L 221 119 Z M 118 119 L 118 118 L 119 117 L 120 117 L 121 118 L 119 120 Z M 122 116 L 123 115 L 124 115 L 125 116 L 124 117 L 123 117 Z M 209 115 L 210 114 L 212 114 L 213 115 L 213 116 L 211 118 L 209 116 Z M 125 115 L 126 114 L 127 115 L 127 116 L 126 117 L 125 116 Z M 184 114 L 185 113 L 192 113 L 193 114 L 193 115 L 192 116 L 185 116 L 184 115 Z M 170 114 L 171 113 L 172 113 L 173 114 L 173 115 L 172 116 Z M 138 113 L 139 112 L 140 113 L 140 114 L 139 115 L 138 114 Z M 135 113 L 136 112 L 138 114 L 137 115 L 136 115 L 135 114 Z M 151 112 L 152 111 L 153 112 L 152 113 Z M 171 112 L 173 110 L 174 111 L 174 112 L 173 113 L 172 113 Z M 194 110 L 195 109 L 198 109 L 199 110 L 201 110 L 204 113 L 205 113 L 206 114 L 204 116 L 203 115 L 201 115 L 200 116 L 196 116 L 195 115 L 196 114 L 196 112 Z M 153 113 L 153 112 L 154 111 L 155 111 L 158 109 L 160 109 L 162 111 L 163 110 L 166 110 L 167 111 L 165 114 L 162 114 L 161 115 L 156 115 Z M 137 108 L 138 107 L 139 108 L 138 109 Z M 178 106 L 179 106 L 180 107 L 183 107 L 184 108 L 184 109 L 183 110 L 183 113 L 184 114 L 183 115 L 182 115 L 181 114 L 178 115 L 174 111 L 175 110 L 176 110 L 177 111 L 178 110 L 177 109 L 177 107 Z M 170 106 L 170 105 L 171 104 L 172 104 L 173 105 L 171 107 Z M 572 39 L 573 38 L 574 39 L 573 40 Z M 595 22 L 595 21 L 596 20 L 597 20 L 598 21 L 596 23 Z\" fill=\"#052F97\" fill-rule=\"evenodd\"/>\n</svg>";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return await route(request, env);
    } catch (error) {
      console.error(error);
      return htmlPage(
        "error",
        `<main class="shell utility-page"><h1>Something went wrong.</h1><p class="muted">${escapeHtml(
          error instanceof Error ? error.message : "Unknown error",
        )}</p><p><a href="/">Return home</a></p></main>`,
        500,
      );
    }
  },
} satisfies ExportedHandler<Env>;

async function route(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === "GET" && path === "/") {
    return renderHome(request, env);
  }

  if (request.method === "GET" && path === "/go") {
    const raw = url.searchParams.get("paper") ?? url.searchParams.get("arxiv") ?? "";
    const id = normalizePaperInput(raw);
    if (!id) {
      return redirect("/?error=Enter+a+valid+arXiv+ID,+DOI,+or+paper+URL");
    }
    return redirect(`/p/${encodeURIComponent(id)}`);
  }

  if (request.method === "GET" && path.startsWith("/p/")) {
    const id = normalizePaperInput(decodeURIComponent(path.slice(3)));
    if (!id) return notFound("Invalid paper identifier or URL.");
    return renderPaper(request, env, id);
  }

  if (request.method === "GET" && path.startsWith("/api/papers/")) {
    const id = normalizePaperInput(decodeURIComponent(path.slice("/api/papers/".length)));
    if (!id) return json({ error: "invalid paper identifier or URL" }, 400);
    const paper = await ensurePaper(env, id);
    const identifiers = await getPaperIdentifiers(env, paper.arxiv_id);
    return json({
      ...paper,
      authors: safeJsonArray(paper.authors_json).map(normalizeAuthorName),
      identifiers,
      preferred_id: preferredPaperId(identifiers, paper.arxiv_id),
    });
  }

  if (request.method === "POST" && path === "/api/comments") {
    return createComment(request, env);
  }

  if (request.method === "GET" && path === "/auth/orcid") {
    return beginOrcidAuth(request, env);
  }

  if (request.method === "GET" && path === "/auth/orcid/callback") {
    return finishOrcidAuth(request, env);
  }

  if (request.method === "POST" && path === "/logout") {
    return logout(request, env);
  }


  if (request.method === "GET" && path === "/favicon.svg") {
    return new Response(TRAILS_LOGO_SVG, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=604800, immutable",
      },
    });
  }

  if (request.method === "GET" && path === "/health") {
    return json({ ok: true, service: "trails" });
  }

  return notFound("Page not found.");
}

async function renderHome(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const user = await currentUser(request, env);
  const error = url.searchParams.get("error");

  return htmlPage(
    "trails",
    `<header class="topbar">
      ${renderBrand()}
      ${renderIdentity(user)}
    </header>
    <main class="shell home">
      <h1>Through the maze.</h1>
      ${error ? `<p class="notice">${escapeHtml(error)}</p>` : ""}
      <form class="lookup" action="/go" method="get">
        <label for="paper">paper</label>
        <div class="lookup-control">
          <input id="paper" name="paper" placeholder="Paste an arXiv ID, DOI, or paper URL" autocomplete="off" required>
          <button type="submit">Open</button>
        </div>
      </form>
    </main>`,
  );
}

async function renderPaper(request: Request, env: Env, requestedPaperId: string): Promise<Response> {
  const paper = await ensurePaper(env, requestedPaperId);
  const identifiers = await getPaperIdentifiers(env, paper.arxiv_id);
  const publicPaperId = preferredPaperId(identifiers, paper.arxiv_id);
  const requestUrl = new URL(request.url);

  if (requestedPaperId !== publicPaperId) {
    return redirect(`/p/${encodeURIComponent(publicPaperId)}${requestUrl.search}`);
  }

  const user = await currentUser(request, env);
  const replyToRaw = requestUrl.searchParams.get("reply");
  const replyTo = replyToRaw && /^\d+$/.test(replyToRaw) ? Number(replyToRaw) : null;
  const requestedTab = requestUrl.searchParams.get("tab");
  const tab = requestedTab === "references" || requestedTab === "related" ? requestedTab : "discussion";
  const storagePaperId = paper.arxiv_id;

  const result = await env.DB.prepare(
    `SELECT c.id, c.paper_id, c.user_id, c.parent_id, c.body, c.created_at,
            u.display_name, u.orcid
       FROM comments c
       JOIN users u ON u.id = c.user_id
      WHERE c.paper_id = ?
      ORDER BY c.created_at ASC, c.id ASC`,
  )
    .bind(storagePaperId)
    .all<CommentRow>();

  const comments = result.results ?? [];
  const commentIds = new Set(comments.map((comment) => comment.id));
  const validReplyTo = replyTo && commentIds.has(replyTo) ? replyTo : null;
  const authors = safeJsonArray(paper.authors_json).map(normalizeAuthorName);
  const paperUrl = `/p/${encodeURIComponent(publicPaperId)}`;

  const tabLink = (id: "discussion" | "references" | "related", label: string): string =>
    `<a href="${paperUrl}?tab=${id}"${tab === id ? ` class="active" aria-current="page"` : ""}>${label}</a>`;

  const discussion = `<section class="discussion">
    <div class="discussion-meta">
      <span>${comments.length} ${comments.length === 1 ? "comment" : "comments"}</span>
    </div>
    ${renderComposer(user, storagePaperId, publicPaperId, validReplyTo)}
    ${comments.length ? renderCommentTree(comments, publicPaperId) : `<p class="empty">No discussion yet.</p>`}
  </section>`;

  const references = `<section class="tab-empty">
    <h2>References</h2>
    <p>Not indexed yet.</p>
  </section>`;

  const related = `<section class="tab-empty">
    <h2>Related papers</h2>
    <p>Not indexed yet.</p>
  </section>`;

  const tabContent = tab === "references" ? references : tab === "related" ? related : discussion;

  return htmlPage(
    paper.title,
    `<header class="topbar">
      ${renderBrand()}
      ${renderIdentity(user)}
    </header>
    <main class="shell paper-page">
      <a class="back" href="/">← papers</a>

      <article class="paper-window">
        <div class="paper-grid">
          <aside class="paper-meta" aria-label="Paper metadata">
            ${renderPaperSources(identifiers)}
          </aside>

          <div class="paper-main">
            <div class="paper-summary">
              <h1>${escapeHtml(paper.title)}</h1>
              <p class="authors">${authors.map(escapeHtml).join(", ")}</p>

              <details class="abstract-disclosure">
                <summary>Abstract</summary>
                <p>${escapeHtml(paper.abstract)}</p>
              </details>
            </div>

            <nav class="paper-tabs" aria-label="Paper sections">
              ${tabLink("discussion", "Discussion")}
              ${tabLink("references", "References")}
              ${tabLink("related", "Related papers")}
            </nav>

            <div class="paper-tab">
              ${tabContent}
            </div>
          </div>
        </div>
      </article>
    </main>`,
  );
}

function renderComposer(
  user: User | null,
  storagePaperId: string,
  publicPaperId: string,
  replyTo: number | null,
): string {
  if (!user) {
    const next = `/p/${encodeURIComponent(publicPaperId)}`;
    return `<div class="signin-plain">
      <p>Sign in with ORCID to contribute.</p>
      <a class="button-link" href="/auth/orcid?next=${encodeURIComponent(next)}">Sign in with ORCID</a>
    </div>`;
  }

  return `<form id="comment-form" class="composer" action="/api/comments" method="post">
    <input type="hidden" name="paper_id" value="${escapeAttr(storagePaperId)}">
    ${replyTo ? `<input type="hidden" name="parent_id" value="${replyTo}">` : ""}
    <div class="composer-meta">
      <span>Commenting as <strong>${escapeHtml(user.display_name)}</strong></span>
      ${replyTo ? `<a href="/p/${encodeURIComponent(publicPaperId)}#comment-form">cancel reply</a>` : ""}
    </div>
    ${replyTo ? `<p class="reply-note">Replying to comment #${replyTo}</p>` : ""}
    <textarea name="body" rows="5" maxlength="5000" placeholder="Add to the discussion…" required></textarea>
    <div class="composer-actions">
      <span>Plain text · 5,000 characters max</span>
      <button type="submit">Post comment</button>
    </div>
  </form>`;
}

function renderCommentTree(comments: CommentRow[], paperId: string): string {
  const children = new Map<number | null, CommentRow[]>();

  for (const comment of comments) {
    const parent = comment.parent_id && comments.some((item) => item.id === comment.parent_id)
      ? comment.parent_id
      : null;
    const list = children.get(parent) ?? [];
    list.push(comment);
    children.set(parent, list);
  }

  const renderBranch = (parentId: number | null, depth: number): string => {
    const list = children.get(parentId) ?? [];
    return list
      .map((comment) => {
        const replies = renderBranch(comment.id, depth + 1);
        return `<article class="comment" id="comment-${comment.id}" style="--depth:${Math.min(depth, 6)}">
          <div class="comment-head">
            <a href="https://orcid.org/${escapeAttr(comment.orcid)}" rel="noreferrer">${escapeHtml(comment.display_name)}</a>
            <span>ORCID ${escapeHtml(comment.orcid)}</span>
            <time datetime="${escapeAttr(comment.created_at)}">${escapeHtml(formatDate(comment.created_at))}</time>
          </div>
          <div class="comment-body">${escapeHtml(comment.body).replace(/\n/g, "<br>")}</div>
          <div class="comment-actions">
            <a href="/p/${encodeURIComponent(paperId)}?tab=discussion&reply=${comment.id}#comment-form">reply</a>
            <a href="#comment-${comment.id}">#${comment.id}</a>
          </div>
          ${replies ? `<div class="replies">${replies}</div>` : ""}
        </article>`;
      })
      .join("");
  };

  return `<div class="comments">${renderBranch(null, 0)}</div>`;
}

async function createComment(request: Request, env: Env): Promise<Response> {
  const user = await currentUser(request, env);
  if (!user) return new Response("Authentication required", { status: 401 });

  assertSameOrigin(request);

  const form = await request.formData();
  const rawPaper = String(form.get("paper_id") ?? "");
  const paperId = normalizePaperInput(rawPaper);
  const body = String(form.get("body") ?? "").trim();
  const parentRaw = String(form.get("parent_id") ?? "").trim();

  if (!paperId) return new Response("Invalid paper identifier or URL", { status: 400 });
  if (!body || body.length > 5000) {
    return new Response("Comment must contain 1–5000 characters", { status: 400 });
  }

  const paper = await ensurePaper(env, paperId);
  const storagePaperId = paper.arxiv_id;

  let parentId: number | null = null;
  if (parentRaw) {
    if (!/^\d+$/.test(parentRaw)) return new Response("Invalid parent comment", { status: 400 });
    parentId = Number(parentRaw);
    const parent = await env.DB.prepare(
      "SELECT id FROM comments WHERE id = ? AND paper_id = ?",
    )
      .bind(parentId, storagePaperId)
      .first();
    if (!parent) return new Response("Parent comment not found", { status: 400 });
  }

  await env.DB.prepare(
    "INSERT INTO comments (paper_id, user_id, parent_id, body) VALUES (?, ?, ?, ?)",
  )
    .bind(storagePaperId, user.id, parentId, body)
    .run();

  const identifiers = await getPaperIdentifiers(env, storagePaperId);
  const publicPaperId = preferredPaperId(identifiers, storagePaperId);
  return redirect(`/p/${encodeURIComponent(publicPaperId)}`, 303);
}

async function beginOrcidAuth(request: Request, env: Env): Promise<Response> {
  if (!env.ORCID_CLIENT_ID) {
    return new Response("ORCID_CLIENT_ID is not configured", { status: 503 });
  }

  const url = new URL(request.url);
  const requestedNext = url.searchParams.get("next") ?? "/";
  const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/";
  const state = randomToken();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await env.DB.prepare(
    "INSERT INTO oauth_states (state, expires_at) VALUES (?, ?)",
  )
    .bind(`${state}:${base64UrlEncode(next)}`, expiresAt)
    .run();

  const base = env.ORCID_BASE_URL ?? "https://orcid.org";
  const redirectUri = env.ORCID_REDIRECT_URI ?? `${url.origin}/auth/orcid/callback`;
  const authorize = new URL("/oauth/authorize", base);
  authorize.searchParams.set("client_id", env.ORCID_CLIENT_ID);
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("scope", "/authenticate");
  authorize.searchParams.set("redirect_uri", redirectUri);
  authorize.searchParams.set("state", `${state}:${base64UrlEncode(next)}`);

  return Response.redirect(authorize.toString(), 302);
}

async function finishOrcidAuth(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) return new Response("Missing OAuth code or state", { status: 400 });

  const saved = await env.DB.prepare(
    "SELECT state, expires_at FROM oauth_states WHERE state = ?",
  )
    .bind(state)
    .first<{ state: string; expires_at: string }>();

  await env.DB.prepare("DELETE FROM oauth_states WHERE state = ?").bind(state).run();

  if (!saved || Date.parse(saved.expires_at) < Date.now()) {
    return new Response("OAuth state is invalid or expired", { status: 400 });
  }

  const base = env.ORCID_BASE_URL ?? "https://orcid.org";
  const redirectUri = env.ORCID_REDIRECT_URI ?? `${url.origin}/auth/orcid/callback`;

  const tokenResponse = await fetch(new URL("/oauth/token", base), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: env.ORCID_CLIENT_ID,
      client_secret: env.ORCID_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenResponse.ok) {
    const details = await tokenResponse.text();
    console.error("ORCID token exchange failed", tokenResponse.status, details);
    return new Response("ORCID sign-in failed", { status: 502 });
  }

  const token = (await tokenResponse.json()) as {
    orcid?: string;
    name?: string;
  };

  if (!token.orcid) return new Response("ORCID did not return an iD", { status: 502 });

  const displayName = token.name?.trim() || token.orcid;

  await env.DB.prepare(
    `INSERT INTO users (orcid, display_name)
     VALUES (?, ?)
     ON CONFLICT(orcid) DO UPDATE SET display_name = excluded.display_name`,
  )
    .bind(token.orcid, displayName)
    .run();

  const user = await env.DB.prepare(
    "SELECT id, orcid, display_name FROM users WHERE orcid = ?",
  )
    .bind(token.orcid)
    .first<User>();

  if (!user) return new Response("Could not create user", { status: 500 });

  const session = randomToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await env.DB.prepare(
    "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)",
  )
    .bind(session, user.id, expiresAt)
    .run();

  const next = decodeNextFromState(state);

  return new Response(null, {
    status: 302,
    headers: {
      Location: next,
      "Set-Cookie": sessionCookie(session, request, 30 * 24 * 60 * 60),
    },
  });
}

async function logout(request: Request, env: Env): Promise<Response> {
  assertSameOrigin(request);
  const cookies = parseCookies(request.headers.get("Cookie") ?? "");
  const token = cookies.get("session");

  if (token) {
    await env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
  }

  return new Response(null, {
    status: 303,
    headers: {
      Location: "/",
      "Set-Cookie": sessionCookie("", request, 0),
    },
  });
}

async function currentUser(request: Request, env: Env): Promise<User | null> {
  const cookies = parseCookies(request.headers.get("Cookie") ?? "");
  const token = cookies.get("session");
  if (!token) return null;

  const row = await env.DB.prepare(
    `SELECT u.id, u.orcid, u.display_name, s.expires_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.token = ?`,
  )
    .bind(token)
    .first<User & { expires_at: string }>();

  if (!row) return null;

  if (Date.parse(row.expires_at) < Date.now()) {
    await env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
    return null;
  }

  return {
    id: row.id,
    orcid: row.orcid,
    display_name: row.display_name,
  };
}

async function ensurePaper(env: Env, rawPaperId: string): Promise<Paper> {
  const paperId = normalizePaperInput(rawPaperId);
  if (!paperId) throw new Error("Invalid paper identifier or URL");
  const requestedIdentifier = identifierFromPaperId(paperId);
  if (!requestedIdentifier) throw new Error("Invalid paper identifier or URL");

  const aliasedStorageId = await findStorageIdByIdentifier(env, requestedIdentifier);
  if (aliasedStorageId) {
    const aliased = await getPaperByStorageId(env, aliasedStorageId);
    if (aliased) {
      const matching = await findMatchingPaper(env, aliased, aliasedStorageId);
      if (matching) {
        const storageId = await mergePaperRows(env, aliasedStorageId, matching.arxiv_id);
        const merged = await getPaperByStorageId(env, storageId);
        if (merged) return merged;
      }
      return aliased;
    }
  }

  let cached = await getPaperByStorageId(env, paperId);
  if (cached) {
    const existingIdentifiers = await getPaperIdentifiers(env, cached.arxiv_id);
    let storageId = cached.arxiv_id;

    if (existingIdentifiers.length === 0) {
      storageId = await enrichPaperIdentifiers(env, cached, requestedIdentifier);
    }

    const matching = await findMatchingPaper(env, cached, storageId);
    if (matching) storageId = await mergePaperRows(env, storageId, matching.arxiv_id);

    cached = await getPaperByStorageId(env, storageId);
    if (!cached) throw new Error("Could not resolve cached paper");
    return cached;
  }

  const fetched = await fetchPaperByInput(paperId);

  for (const identifier of fetched.identifiers) {
    const existingStorageId = await findStorageIdByIdentifier(env, identifier);
    if (existingStorageId) {
      const storageId = await attachIdentifiers(env, existingStorageId, fetched.identifiers);
      const existing = await getPaperByStorageId(env, storageId);
      if (existing) return existing;
    }
  }

  const matching = await findMatchingPaper(env, fetched.paper, null);
  if (matching) {
    const storageId = await attachIdentifiers(env, matching.arxiv_id, fetched.identifiers);
    const existing = await getPaperByStorageId(env, storageId);
    if (existing) return existing;
  }

  await env.DB.prepare(
    `INSERT INTO papers (arxiv_id, title, authors_json, abstract, published_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      fetched.paper.arxiv_id,
      fetched.paper.title,
      fetched.paper.authors_json,
      fetched.paper.abstract,
      fetched.paper.published_at,
      fetched.paper.updated_at,
    )
    .run();

  const storageId = await attachIdentifiers(env, fetched.paper.arxiv_id, fetched.identifiers);
  const paper = await getPaperByStorageId(env, storageId);
  if (!paper) throw new Error("Could not store paper");
  return paper;
}

async function enrichPaperIdentifiers(
  env: Env,
  paper: Paper,
  requestedIdentifier: PaperIdentifier,
): Promise<string> {
  const discovered: PaperIdentifier[] = [requestedIdentifier];

  try {
    if (requestedIdentifier.type === "arxiv") {
      discovered.push(...await fetchArxivRelations(requestedIdentifier.value));
    } else if (requestedIdentifier.type === "doi") {
      const refreshed = await fetchPaperFromCrossref(requestedIdentifier.value, paper.arxiv_id);
      discovered.push(...refreshed.identifiers);
    } else {
      const refreshed = await fetchPaperFromUrl(requestedIdentifier.value, paper.arxiv_id);
      discovered.push(...refreshed.identifiers);
    }
  } catch (error) {
    console.warn("Could not enrich legacy paper identifiers", error);
  }

  return attachIdentifiers(env, paper.arxiv_id, discovered);
}

async function getPaperByStorageId(env: Env, storageId: string): Promise<Paper | null> {
  return env.DB.prepare(
    "SELECT arxiv_id, title, authors_json, abstract, published_at, updated_at FROM papers WHERE arxiv_id = ?",
  )
    .bind(storageId)
    .first<Paper>();
}

async function getPaperIdentifiers(env: Env, storageId: string): Promise<PaperIdentifier[]> {
  const result = await env.DB.prepare(
    `SELECT type, value, paper_id, label, url
       FROM paper_identifiers
      WHERE paper_id = ?
      ORDER BY CASE type WHEN 'doi' THEN 0 WHEN 'arxiv' THEN 1 ELSE 2 END, created_at ASC`,
  )
    .bind(storageId)
    .all<PaperIdentifier>();
  return result.results ?? [];
}

async function findStorageIdByIdentifier(
  env: Env,
  identifier: PaperIdentifier,
): Promise<string | null> {
  const row = await env.DB.prepare(
    "SELECT paper_id FROM paper_identifiers WHERE type = ? AND value = ?",
  )
    .bind(identifier.type, identifier.value)
    .first<{ paper_id: string }>();
  return row?.paper_id ?? null;
}

async function attachIdentifiers(
  env: Env,
  initialStorageId: string,
  identifiers: PaperIdentifier[],
): Promise<string> {
  let storageId = initialStorageId;

  for (const identifier of dedupeIdentifiers(identifiers)) {
    const existingStorageId = await findStorageIdByIdentifier(env, identifier);
    if (existingStorageId && existingStorageId !== storageId) {
      storageId = await mergePaperRows(env, storageId, existingStorageId);
    }

    await env.DB.prepare(
      `INSERT INTO paper_identifiers (type, value, paper_id, label, url)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(type, value) DO UPDATE SET
         label = COALESCE(paper_identifiers.label, excluded.label),
         url = COALESCE(paper_identifiers.url, excluded.url)`,
    )
      .bind(identifier.type, identifier.value, storageId, identifier.label, identifier.url)
      .run();
  }

  return storageId;
}

async function mergePaperRows(env: Env, firstId: string, secondId: string): Promise<string> {
  if (firstId === secondId) return firstId;

  const targetId = storagePriority(firstId) <= storagePriority(secondId) ? firstId : secondId;
  const duplicateId = targetId === firstId ? secondId : firstId;

  await env.DB.prepare("UPDATE comments SET paper_id = ? WHERE paper_id = ?")
    .bind(targetId, duplicateId)
    .run();
  await env.DB.prepare("UPDATE OR IGNORE paper_identifiers SET paper_id = ? WHERE paper_id = ?")
    .bind(targetId, duplicateId)
    .run();
  await env.DB.prepare("DELETE FROM paper_identifiers WHERE paper_id = ?")
    .bind(duplicateId)
    .run();
  await env.DB.prepare("DELETE FROM papers WHERE arxiv_id = ?")
    .bind(duplicateId)
    .run();

  return targetId;
}

function storagePriority(storageId: string): number {
  if (normalizeArxivInput(storageId) === storageId) return 0;
  if (storageId.startsWith("doi:")) return 1;
  return 2;
}

async function findMatchingPaper(
  env: Env,
  paper: Paper,
  excludeStorageId: string | null,
): Promise<Paper | null> {
  const result = await env.DB.prepare(
    `SELECT arxiv_id, title, authors_json, abstract, published_at, updated_at
       FROM papers
      WHERE (? IS NULL OR arxiv_id <> ?)
      ORDER BY fetched_at DESC
      LIMIT 250`,
  )
    .bind(excludeStorageId, excludeStorageId)
    .all<Paper>();

  const targetTitle = titleFingerprint(paper.title);
  if (!targetTitle) return null;

  for (const candidate of result.results ?? []) {
    if (titleFingerprint(candidate.title) !== targetTitle) continue;
    if (authorListsMatch(paper.authors_json, candidate.authors_json)) return candidate;
  }

  return null;
}

function titleFingerprint(value: string): string {
  return decodeHtmlEntities(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function authorListsMatch(firstJson: string, secondJson: string): boolean {
  const first = safeJsonArray(firstJson).map(authorFingerprint).filter(Boolean);
  const second = safeJsonArray(secondJson).map(authorFingerprint).filter(Boolean);
  if (!first.length || !second.length) return false;

  const secondSet = new Set(second);
  const overlap = first.filter((author) => secondSet.has(author)).length;
  return overlap >= Math.min(first.length, second.length, 2) &&
    overlap / Math.min(first.length, second.length) >= 0.75;
}

function authorFingerprint(value: string): string {
  return normalizeAuthorName(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function dedupeIdentifiers(identifiers: PaperIdentifier[]): PaperIdentifier[] {
  const seen = new Set<string>();
  return identifiers.filter((identifier) => {
    const key = `${identifier.type}:${identifier.value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function identifierFromPaperId(paperId: string): PaperIdentifier | null {
  if (paperId.startsWith("doi:")) {
    const doi = paperId.slice(4);
    return { type: "doi", value: doi, label: null, url: `https://doi.org/${doi}` };
  }

  if (paperId.startsWith("url:")) {
    const url = decodeUrlPaperId(paperId);
    if (!url) return null;
    return { type: "url", value: url, label: sourceHost(url), url };
  }

  const arxiv = normalizeArxivInput(paperId);
  if (!arxiv) return null;
  return {
    type: "arxiv",
    value: arxiv,
    label: "arXiv",
    url: `https://arxiv.org/abs/${encodeURIComponent(arxiv)}`,
  };
}

function preferredPaperId(identifiers: PaperIdentifier[], fallbackStorageId: string): string {
  const doi = identifiers.find((identifier) => identifier.type === "doi" && !isArxivIssuedDoi(identifier.value));
  if (doi) return `doi:${doi.value}`;
  const arxiv = identifiers.find((identifier) => identifier.type === "arxiv");
  if (arxiv) return arxiv.value;
  const url = identifiers.find((identifier) => identifier.type === "url");
  if (url) return `url:${encodeURIComponent(url.value)}`;
  return fallbackStorageId;
}

function renderPaperSources(identifiers: PaperIdentifier[]): string {
  const doi = identifiers.find((identifier) => identifier.type === "doi" && !isArxivIssuedDoi(identifier.value));
  const arxiv = identifiers.find((identifier) => identifier.type === "arxiv");
  const source = identifiers.find((identifier) => identifier.type === "url");

  if (doi) {
    const venue = doi.label && doi.label !== "Published version" ? doi.label : "Published version";
    return `<p class="paper-venue">${escapeHtml(venue)}</p>
      <div class="paper-links">
        <a class="paper-source" href="${escapeAttr(doi.url)}" rel="noreferrer">published version ↗</a>
        ${arxiv ? `<a class="paper-source" href="${escapeAttr(arxiv.url)}" rel="noreferrer">arXiv preprint ↗</a>` : ""}
      </div>
      <p class="paper-doi">DOI ${escapeHtml(doi.value)}</p>`;
  }

  if (arxiv) {
    return `<p class="paper-id">arXiv:${escapeHtml(arxiv.value)}</p>
      <a class="paper-source" href="${escapeAttr(arxiv.url)}" rel="noreferrer">open on arXiv ↗</a>`;
  }

  if (source) {
    return `<p class="paper-id">${escapeHtml(source.label ?? sourceHost(source.value))}</p>
      <a class="paper-source" href="${escapeAttr(source.url)}" rel="noreferrer">open source ↗</a>`;
  }

  return `<p class="paper-id">paper</p>`;
}

function sourceHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "source";
  }
}

async function fetchPaperByInput(paperId: string): Promise<FetchedPaper> {
  if (paperId.startsWith("doi:")) {
    return fetchPaperFromCrossref(paperId.slice(4), paperId);
  }

  if (paperId.startsWith("url:")) {
    const sourceUrl = decodeUrlPaperId(paperId);
    if (!sourceUrl) throw new Error("Invalid paper URL");
    return fetchPaperFromUrl(sourceUrl, paperId);
  }

  try {
    return await fetchPaperFromAbs(paperId);
  } catch (error) {
    console.warn("Fast arXiv metadata lookup failed; falling back to Atom API", error);
    return fetchPaperFromAtom(paperId);
  }
}

async function fetchPaperFromAbs(arxivId: string): Promise<FetchedPaper> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);

  try {
    const response = await fetch(`https://arxiv.org/abs/${encodeURIComponent(arxivId)}`, {
      headers: {
        "User-Agent": "trails/0.1",
        Accept: "text/html",
      },
      signal: controller.signal,
    });

    if (!response.ok) throw new Error(`arXiv abstract page returned HTTP ${response.status}`);

    const html = await response.text();
    const title = metaContent(html, "citation_title");
    const authors = metaContents(html, "citation_author").map(normalizeAuthorName);
    const published = metaContent(html, "citation_date") || null;
    const abstractMatch = html.match(
      /<blockquote[^>]*class=["'][^"']*abstract[^"']*["'][^>]*>([\s\S]*?)<\/blockquote>/i,
    );
    const abstract = abstractMatch
      ? cleanHtmlText(
          abstractMatch[1].replace(
            /<span[^>]*class=["'][^"']*descriptor[^"']*["'][^>]*>[\s\S]*?<\/span>/i,
            "",
          ),
        )
      : "";

    if (!title || !authors.length || !abstract) {
      throw new Error("Could not parse arXiv abstract page metadata");
    }

    let relations: PaperIdentifier[] = [];
    try {
      relations = await fetchArxivRelations(arxivId);
    } catch (error) {
      console.warn("Could not fetch arXiv publication relations", error);
    }

    return {
      paper: {
        arxiv_id: arxivId,
        title,
        authors_json: JSON.stringify(authors),
        abstract,
        published_at: published,
        updated_at: published,
      },
      identifiers: dedupeIdentifiers([
        {
          type: "arxiv",
          value: arxivId,
          label: "arXiv",
          url: `https://arxiv.org/abs/${encodeURIComponent(arxivId)}`,
        },
        ...relations,
      ]),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchArxivRelations(arxivId: string): Promise<PaperIdentifier[]> {
  const endpoint = new URL("https://export.arxiv.org/api/query");
  endpoint.searchParams.set("id_list", arxivId);
  const response = await fetch(endpoint, {
    headers: {
      "User-Agent": "trails/0.1",
      Accept: "application/atom+xml",
    },
  });
  if (!response.ok) return [];

  const xml = await response.text();
  const entry = xml.match(/<entry>([\s\S]*?)<\/entry>/)?.[1] ?? "";
  const doi = normalizePublicationDoi(cleanXmlText(extractTag(entry, "arxiv:doi")));
  const journalRef = cleanXmlText(extractTag(entry, "arxiv:journal_ref"));
  if (!doi) return [];

  return [{
    type: "doi",
    value: doi,
    label: journalRef || "Published version",
    url: `https://doi.org/${doi}`,
  }];
}

async function fetchPaperFromAtom(arxivId: string): Promise<FetchedPaper> {
  const endpoint = new URL("https://export.arxiv.org/api/query");
  endpoint.searchParams.set("id_list", arxivId);

  const response = await fetch(endpoint, {
    headers: {
      "User-Agent": "trails/0.1",
      Accept: "application/atom+xml",
    },
  });

  if (!response.ok) throw new Error(`arXiv returned HTTP ${response.status}`);

  const xml = await response.text();
  const entry = xml.match(/<entry>([\s\S]*?)<\/entry>/)?.[1];
  if (!entry) throw new Error(`No arXiv paper found for ${arxivId}`);

  const title = cleanXmlText(extractTag(entry, "title"));
  const abstract = cleanXmlText(extractTag(entry, "summary"));
  const published = extractTag(entry, "published") || null;
  const updated = extractTag(entry, "updated") || null;
  const authors = [...entry.matchAll(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/g)]
    .map((match) => normalizeAuthorName(cleanXmlText(match[1])))
    .filter(Boolean);
  const doi = normalizePublicationDoi(cleanXmlText(extractTag(entry, "arxiv:doi")));
  const journalRef = cleanXmlText(extractTag(entry, "arxiv:journal_ref"));

  if (!title) throw new Error(`Could not parse arXiv metadata for ${arxivId}`);

  const identifiers: PaperIdentifier[] = [{
    type: "arxiv",
    value: arxivId,
    label: "arXiv",
    url: `https://arxiv.org/abs/${encodeURIComponent(arxivId)}`,
  }];
  if (doi) identifiers.push({
    type: "doi",
    value: doi,
    label: journalRef || "Published version",
    url: `https://doi.org/${doi}`,
  });

  return {
    paper: {
      arxiv_id: arxivId,
      title,
      authors_json: JSON.stringify(authors),
      abstract,
      published_at: published,
      updated_at: updated,
    },
    identifiers,
  };
}

async function fetchPaperFromCrossref(doi: string, storageId = `doi:${doi.toLowerCase()}`): Promise<FetchedPaper> {
  const response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, {
    headers: {
      "User-Agent": "trails/0.1",
      Accept: "application/json",
    },
  });

  if (!response.ok) throw new Error(`Crossref returned HTTP ${response.status}`);

  const payload = await response.json() as {
    message?: {
      title?: string[];
      author?: Array<{ given?: string; family?: string; name?: string }>;
      abstract?: string;
      URL?: string;
      publisher?: string;
      "container-title"?: string[];
      "short-container-title"?: string[];
      published?: { "date-parts"?: number[][] };
      "published-print"?: { "date-parts"?: number[][] };
      "published-online"?: { "date-parts"?: number[][] };
      created?: { "date-time"?: string };
    };
  };

  const message = payload.message;
  if (!message) throw new Error(`No Crossref metadata found for ${doi}`);

  const title = cleanHtmlText(message.title?.[0] ?? "");
  const authors = (message.author ?? [])
    .map((author) => author.name ? normalizeAuthorName(author.name) : [author.given, author.family].filter(Boolean).join(" ").trim())
    .filter(Boolean);
  const abstract = cleanHtmlText(message.abstract ?? "");
  const published = crossrefDate(
    message["published-print"] ?? message["published-online"] ?? message.published,
  ) ?? message.created?.["date-time"] ?? null;
  const venue =
    cleanHtmlText(message["container-title"]?.[0] ?? "") ||
    cleanHtmlText(message["short-container-title"]?.[0] ?? "") ||
    cleanHtmlText(message.publisher ?? "") ||
    "Published version";

  if (!title) throw new Error(`Could not parse Crossref metadata for ${doi}`);

  const normalizedDoi = doi.toLowerCase();
  const identifiers: PaperIdentifier[] = [{
    type: "doi",
    value: normalizedDoi,
    label: venue,
    url: `https://doi.org/${normalizedDoi}`,
  }];
  const publisherUrl = message.URL ? normalizePaperUrl(message.URL) : null;
  if (publisherUrl) identifiers.push({
    type: "url",
    value: publisherUrl,
    label: venue,
    url: publisherUrl,
  });

  try {
    const arxiv = await findArxivByTitleAndAuthors(title, authors);
    if (arxiv) identifiers.push(arxiv);
  } catch (error) {
    console.warn("Could not resolve Crossref paper to arXiv", error);
  }

  return {
    paper: {
      arxiv_id: storageId,
      title,
      authors_json: JSON.stringify(authors),
      abstract,
      published_at: published,
      updated_at: published,
    },
    identifiers,
  };
}

async function findArxivByTitleAndAuthors(
  title: string,
  authors: string[],
): Promise<PaperIdentifier | null> {
  const words = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .match(/[a-z0-9]+/g)
    ?.filter((word) => word.length >= 6)
    .slice(0, 3) ?? [];

  if (words.length < 2) return null;

  const endpoint = new URL("https://export.arxiv.org/api/query");
  endpoint.searchParams.set(
    "search_query",
    words.map((word) => `ti:${word}`).join(" AND "),
  );
  endpoint.searchParams.set("start", "0");
  endpoint.searchParams.set("max_results", "8");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);

  try {
    const response = await fetch(endpoint, {
      headers: {
        "User-Agent": "trails/0.1",
        Accept: "application/atom+xml",
      },
      signal: controller.signal,
    });

    if (!response.ok) return null;

    const xml = await response.text();
    const targetTitle = titleFingerprint(title);
    const targetAuthors = authors.map(authorFingerprint).filter(Boolean);

    for (const match of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
      const entry = match[1];
      const candidateTitle = cleanXmlText(extractTag(entry, "title"));
      if (titleFingerprint(candidateTitle) !== targetTitle) continue;

      const candidateAuthors = [...entry.matchAll(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/g)]
        .map((authorMatch) => authorFingerprint(cleanXmlText(authorMatch[1])))
        .filter(Boolean);
      const candidateSet = new Set(candidateAuthors);
      const overlap = targetAuthors.filter((author) => candidateSet.has(author)).length;
      if (targetAuthors.length && overlap / Math.min(targetAuthors.length, candidateAuthors.length) < 0.75) {
        continue;
      }

      const idUrl = cleanXmlText(extractTag(entry, "id"));
      const arxiv = normalizeArxivInput(idUrl);
      if (!arxiv) continue;

      return {
        type: "arxiv",
        value: arxiv,
        label: "arXiv",
        url: `https://arxiv.org/abs/${encodeURIComponent(arxiv)}`,
      };
    }

    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchPaperFromUrl(sourceUrl: string, storageId: string): Promise<FetchedPaper> {
  if (!isSafePaperUrl(sourceUrl)) throw new Error("Only public HTTPS paper URLs are supported");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(sourceUrl, {
      headers: {
        "User-Agent": "trails/0.1",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: controller.signal,
    });

    if (!response.ok) throw new Error(`Paper page returned HTTP ${response.status}`);

    const finalUrl = normalizePaperUrl(response.url || sourceUrl);
    if (!finalUrl) throw new Error("Paper URL redirected to an unsupported address");

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
      throw new Error("Paper URL did not return an HTML page");
    }

    const contentLength = Number(response.headers.get("content-length") ?? "0");
    if (contentLength > 3_000_000) throw new Error("Paper page is too large to inspect");

    const html = await response.text();
    const doi = normalizePublicationDoi(metaContent(html, "citation_doi"));
    if (doi) {
      try {
        const crossref = await fetchPaperFromCrossref(doi, storageId);
        crossref.identifiers.push({
          type: "url",
          value: finalUrl,
          label: sourceHost(finalUrl),
          url: finalUrl,
        });
        crossref.identifiers = dedupeIdentifiers(crossref.identifiers);
        return crossref;
      } catch (error) {
        console.warn("Crossref lookup from paper URL failed; using page metadata", error);
      }
    }

    const title =
      metaContent(html, "citation_title") ||
      metaPropertyContent(html, "og:title") ||
      cleanHtmlText(extractHtmlTitle(html));
    const authors = metaContents(html, "citation_author").map(normalizeAuthorName);
    const abstract =
      metaContent(html, "citation_abstract") ||
      metaContent(html, "description") ||
      metaPropertyContent(html, "og:description");
    const published =
      metaContent(html, "citation_publication_date") ||
      metaContent(html, "citation_date") ||
      null;

    if (!title) throw new Error("Could not find paper metadata at this URL");

    return {
      paper: {
        arxiv_id: storageId,
        title,
        authors_json: JSON.stringify(authors),
        abstract,
        published_at: published,
        updated_at: published,
      },
      identifiers: [{
        type: "url",
        value: finalUrl,
        label: sourceHost(finalUrl),
        url: finalUrl,
      }],
    };
  } finally {
    clearTimeout(timeout);
  }
}

function normalizePublicationDoi(raw: string): string | null {
  const doi = normalizeDoiInput(raw);
  return doi && !isArxivIssuedDoi(doi) ? doi : null;
}

function isArxivIssuedDoi(doi: string): boolean {
  return /^10\.48550\/arxiv\./i.test(doi);
}

function crossrefDate(value?: { "date-parts"?: number[][] }): string | null {
  const parts = value?.["date-parts"]?.[0];
  if (!parts?.length) return null;
  const [year, month = 1, day = 1] = parts;
  if (!year) return null;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function metaPropertyContent(html: string, property: string): string {
  const escaped = property.replace(/[.*+?^$()|[\\]{}]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${escaped}["'][^>]+content=["']([\\s\\S]*?)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([\\s\\S]*?)["'][^>]+property=["']${escaped}["'][^>]*>`, "i"),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return decodeHtmlEntities(match[1]).trim();
  }

  return "";
}

function extractHtmlTitle(html: string): string {
  return html.match(/<title[^>]*>([\\s\\S]*?)<\/title>/i)?.[1] ?? "";
}

function metaContent(html: string, name: string): string {
  const escaped = name;
  const patterns = [
    new RegExp(`<meta[^>]+name=["']${escaped}["'][^>]+content=["']([\\s\\S]*?)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([\\s\\S]*?)["'][^>]+name=["']${escaped}["'][^>]*>`, "i"),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return decodeHtmlEntities(match[1]).trim();
  }

  return "";
}

function metaContents(html: string, name: string): string[] {
  const escaped = name;
  const pattern = new RegExp(
    `<meta[^>]+name=["']${escaped}["'][^>]+content=["']([\\s\\S]*?)["'][^>]*>`,
    "gi",
  );
  return [...html.matchAll(pattern)]
    .map((match) => decodeHtmlEntities(match[1]).trim())
    .filter(Boolean);
}

function cleanHtmlText(value: string): string {
  return decodeHtmlEntities(
    value
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}

function normalizePaperInput(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;

  const arxiv = normalizeArxivInput(value);
  if (arxiv) return arxiv;

  if (value.toLowerCase().startsWith("doi:")) {
    const doi = normalizeDoiInput(value.slice(4));
    if (!doi) return null;
    const arxivFromDoi = arxivIdFromDoi(doi);
    return arxivFromDoi ?? `doi:${doi}`;
  }

  if (value.toLowerCase().startsWith("url:")) {
    const decoded = decodeUrlPaperId(value);
    return decoded && isSafePaperUrl(decoded) ? `url:${encodeURIComponent(decoded)}` : null;
  }

  const doi = normalizeDoiInput(value);
  if (doi) {
    const arxivFromDoi = arxivIdFromDoi(doi);
    return arxivFromDoi ?? `doi:${doi}`;
  }

  const url = normalizePaperUrl(value);
  return url ? `url:${encodeURIComponent(url)}` : null;
}

function normalizeArxivInput(raw: string): string | null {
  let value = raw.trim();
  if (!value) return null;

  value = value.replace(/^https?:\/\/(?:www\.)?arxiv\.org\/(?:abs|pdf)\//i, "");
  value = value.replace(/^arXiv:/i, "");
  value = value.replace(/\.pdf$/i, "");
  value = value.split(/[?#]/, 1)[0];
  value = value.replace(/v\d+$/i, "");

  const modern = /^\d{4}\.\d{4,5}$/;
  const legacy = /^[A-Za-z0-9.\-]+\/\d{7}$/;

  return modern.test(value) || legacy.test(value) ? value : null;
}

function normalizeDoiInput(raw: string): string | null {
  let value = decodeURIComponentSafe(raw.trim());
  if (!value) return null;

  value = value.replace(/^doi:\s*/i, "");
  value = value.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "");
  value = value.split(/[?#]/, 1)[0];

  const direct = value.match(/^10\.\d{4,9}\/\S+$/i)?.[0];
  if (direct) return direct.replace(/[\s.]+$/, "").toLowerCase();

  const embedded = value.match(/10\.\d{4,9}\/[^\s"'<>]+/i)?.[0];
  return embedded ? embedded.replace(/[\s.]+$/, "").toLowerCase() : null;
}

function arxivIdFromDoi(doi: string): string | null {
  const match = doi.match(/^10\.48550\/arxiv\.(.+)$/i);
  return match ? normalizeArxivInput(match[1]) : null;
}

function normalizePaperUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return null;
    url.hash = "";
    const normalized = url.toString();
    return isSafePaperUrl(normalized) ? normalized : null;
  } catch {
    return null;
  }
}

function decodeUrlPaperId(paperId: string): string | null {
  if (!paperId.toLowerCase().startsWith("url:")) return null;
  const decoded = decodeURIComponentSafe(paperId.slice(4));
  return normalizePaperUrl(decoded);
}

function isSafePaperUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return false;

    const host = url.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host.endsWith(".local") ||
      host === "::1" ||
      host.startsWith("127.") ||
      host.startsWith("0.") ||
      host.startsWith("10.") ||
      host.startsWith("192.168.") ||
      host.startsWith("169.254.") ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function decodeURIComponentSafe(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizeAuthorName(raw: string): string {
  const value = raw.replace(/\s+/g, " ").trim();
  if (!value) return "";

  const parts = value.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length === 2 && parts[0] && parts[1]) {
    return `${parts[1]} ${parts[0]}`.replace(/\s+/g, " ").trim();
  }

  return value;
}

function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match?.[1] ?? "";
}

function cleanXmlText(value: string): string {
  return decodeXmlEntities(value.replace(/\s+/g, " ").trim());
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}

function renderBrand(): string {
  return `<a class="brand" href="/" aria-label="trails home">
    <img class="brand-mark" src="/favicon.svg" alt="" aria-hidden="true">
    <span>trails</span>
  </a>`;
}

function renderIdentity(user: User | null): string {
  if (!user) {
    return `<a class="identity-link" href="/auth/orcid?next=/">Sign in with ORCID</a>`;
  }

  return `<div class="identity">
    <a href="https://orcid.org/${escapeAttr(user.orcid)}" rel="noreferrer">${escapeHtml(user.display_name)}</a>
    <form action="/logout" method="post"><button class="text-button" type="submit">sign out</button></form>
  </div>`;
}

function htmlPage(title: string, body: string, status = 200): Response {
  return new Response(
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="theme-color" content="#F7F4ED">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400..700&display=swap">
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      --paper: #f7f4ed;
      --ink: #2e2e2a;
      --annotation: #315c84;
      --stone: #a7a39a;
      --muted: #77736c;
      --wash: #ebe6dc;
      --surface: rgba(255, 255, 255, .52);

      --font-main: "Source Serif 4", Georgia, serif;

      --radius-sm: 3px;
      --radius-md: 4px;
      --radius-lg: 4px;

      color: var(--ink);
      background: var(--paper);
      font-family: var(--font-main);
      font-size: 16px;
      line-height: 1.55;
      font-weight: 500;
      font-kerning: normal;
      text-rendering: optimizeLegibility;
    }

    * { box-sizing: border-box; }
    body { margin: 0; background: var(--paper); }
    a { color: inherit; text-decoration: none; }
    a:hover { color: var(--annotation); }
    button, input, textarea { font: inherit; }
    button { cursor: pointer; }

    h1, h2, h3, p { margin-top: 0; }
    h1, h2, h3 {
      font-family: var(--font-main);
      font-weight: 500;
      color: var(--ink);
    }

    .topbar {
      min-height: 72px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
      padding: 10px max(20px, calc((100vw - 980px) / 2));
    }

    .brand {
      display: inline-flex;
      align-items: center;
      gap: 9px;
      text-decoration: none;
      font-family: var(--font-main);
      font-size: 1.48rem;
      font-weight: 600;
      line-height: 1;
      letter-spacing: -.025em;
    }
    .brand:hover { color: var(--ink); }
    .brand-mark {
      width: 34px;
      height: 26px;
      display: block;
      object-fit: contain;
      flex: 0 0 auto;
    }

    .shell {
      width: min(980px, calc(100% - 40px));
      margin: 0 auto;
    }

    .home { padding: 13vh 0 90px; }
    .home h1 {
      max-width: 640px;
      margin: 0;
      font-size: clamp(2.05rem, 4vw, 3rem);
      line-height: 1.08;
      letter-spacing: -.028em;
    }

    .lookup {
      margin-top: 40px;
      max-width: 640px;
    }
    .lookup label,
    .eyebrow {
      display: block;
      margin: 0 0 8px 2px;
      font-family: var(--font-main);
      font-size: .76rem;
      line-height: 1.3;
      letter-spacing: .035em;
      color: var(--muted);
      font-weight: 500;
    }
    .lookup-control {
      display: flex;
      align-items: stretch;
      gap: 8px;
      padding: 0;
      background: transparent;
    }

    input, textarea {
      width: 100%;
      border: 0;
      outline: 0;
      background: #fbf9f3;
      color: var(--ink);
      padding: 13px 14px;
      border-radius: var(--radius-sm);
      font-family: var(--font-main);
    }
    .lookup input {
      min-width: 0;
      background: #ece7dc;
      padding: 13px 14px;
    }
    input:focus-visible,
    textarea:focus-visible {
      background: #f3ede3;
    }
    textarea { resize: vertical; }

    button,
    .button-link {
      border: 0;
      background: var(--annotation);
      color: #fffaf5;
      padding: 11px 16px;
      border-radius: 2px;
      font-family: var(--font-main);
      font-size: .92rem;
      font-weight: 500;
      text-decoration: none;
      white-space: nowrap;
    }
    button:hover,
    .button-link:hover {
      color: #fffaf5;
      filter: brightness(.96);
    }

    .paper-page { padding: 28px 0 90px; }
    .back {
      display: inline-block;
      margin-bottom: 22px;
      color: var(--muted);
      font-size: .8rem;
      text-decoration: none;
    }

    .paper-window {
      padding: 12px 0 0;
      background: transparent;
    }

    .paper-grid {
      display: grid;
      grid-template-columns: 148px minmax(0, 1fr);
      gap: 0 32px;
      align-items: start;
    }

    .paper-meta {
      padding-top: 7px;
    }

    .paper-id {
      margin: 0 0 12px;
      color: var(--annotation);
      font-size: .8rem;
      font-weight: 650;
      line-height: 1.3;
      letter-spacing: .01em;
    }

    .paper-venue {
      margin: 0 0 10px;
      color: var(--annotation);
      font-size: .82rem;
      font-weight: 650;
      line-height: 1.28;
    }

    .paper-links {
      display: grid;
      gap: 6px;
    }

    .paper-source {
      display: inline-block;
      color: var(--muted);
      font-size: .8rem;
      line-height: 1.3;
      white-space: nowrap;
    }

    .paper-doi {
      margin: 12px 0 0;
      color: #8a867e;
      font-size: .68rem;
      line-height: 1.25;
      overflow-wrap: anywhere;
    }

    .paper-main { min-width: 0; }
    .paper-summary { max-width: 760px; }

    .paper-summary h1 {
      max-width: 760px;
      margin: 0;
      font-size: clamp(1.9rem, 3.8vw, 2.9rem);
      line-height: 1.05;
      font-weight: 620;
      letter-spacing: -.025em;
    }

    .authors {
      margin: 20px 0 0;
      max-width: 720px;
      color: #625f58;
      font-size: .98rem;
      font-weight: 520;
      line-height: 1.55;
    }

    .abstract-disclosure {
      max-width: 720px;
      margin-top: 20px;
      color: #59564f;
    }
    .abstract-disclosure summary {
      cursor: pointer;
      color: var(--annotation);
      font-weight: 600;
      list-style: none;
    }
    .abstract-disclosure summary::-webkit-details-marker { display: none; }
    .abstract-disclosure p {
      margin: 12px 0 0;
      max-width: 720px;
      font-size: .97rem;
      line-height: 1.68;
      font-weight: 450;
    }

    .paper-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 24px;
      margin-top: 52px;
      padding: 0;
      background: transparent;
    }
    .paper-tabs a {
      padding: 0;
      color: var(--muted);
      font-size: .9rem;
      font-weight: 600;
      letter-spacing: .012em;
      text-decoration: none;
    }
    .paper-tabs a.active {
      background: transparent;
      color: var(--annotation);
    }
    .paper-tab { margin-top: 32px; }

    .discussion-meta {
      display: flex;
      justify-content: flex-start;
      margin-bottom: 12px;
      color: var(--muted);
      font-family: var(--font-main);
      font-size: .76rem;
      font-weight: 500;
    }

    .signin-plain {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 20px;
      margin: 20px 0 32px;
    }
    .signin-plain p {
      margin: 0;
      color: #5f5b54;
      font-size: .95rem;
    }

    .composer {
      margin: 20px 0 32px;
      padding: 18px 20px;
      background: var(--wash);
      border-radius: 2px;
    }

    .composer-meta,
    .composer-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      color: var(--muted);
      font-size: .76rem;
    }
    .composer-meta strong { color: var(--ink); }
    .composer textarea {
      margin: 12px 0;
      background: #f7f4ed;
      line-height: 1.55;
      border-radius: 2px;
    }
    .reply-note {
      margin-bottom: 0;
      color: var(--muted);
      font-size: .78rem;
    }

    .comments {
      display: grid;
      gap: 32px;
      margin-top: 32px;
    }
    .comment {
      margin-left: calc(var(--depth) * 22px);
      padding: 0;
      background: transparent;
    }
    .comment-head {
      display: flex;
      gap: 9px;
      flex-wrap: wrap;
      align-items: baseline;
      font-size: .76rem;
    }
    .comment-head a {
      color: var(--ink);
      font-weight: 600;
      text-decoration: none;
    }
    .comment-head span,
    .comment-head time {
      color: #8a867e;
      font-family: var(--font-main);
      font-size: .73rem;
    }
    .comment-body {
      margin: 9px 0 10px;
      max-width: 760px;
      line-height: 1.62;
    }
    .comment-actions {
      display: flex;
      gap: 12px;
      color: #8a867e;
      font-size: .74rem;
      font-weight: 500;
    }
    .comment-actions a { text-decoration: none; }
    .replies { margin-top: 22px; }

    .tab-empty {
      min-height: 150px;
      padding: 20px 4px;
      color: var(--muted);
    }
    .tab-empty h2 {
      margin: 0 0 6px;
      font-size: 1.35rem;
    }
    .tab-empty p {
      margin: 0;
      font-size: .93rem;
    }

    .empty,
    .muted { color: var(--muted); }

    .identity {
      display: flex;
      gap: 12px;
      align-items: center;
      font-size: .78rem;
    }
    .identity-link {
      color: var(--muted);
      font-size: .78rem;
      text-decoration: none;
    }
    .identity form { margin: 0; }

    .text-button {
      background: none;
      color: #8a867e;
      padding: 0;
      border-radius: 0;
      font-size: .78rem;
      font-weight: 500;
      text-decoration: none;
    }
    .text-button:hover {
      color: var(--annotation);
      filter: none;
    }

    .notice {
      max-width: 640px;
      margin-top: 22px;
      padding: 11px 13px;
      background: #e3eaf0;
      border-radius: 2px;
      color: #3d5569;
      font-size: .9rem;
    }

    .utility-page {
      padding: 15vh 0 80px;
      max-width: 720px;
    }
    .utility-page h1 {
      margin: 0 0 14px;
      font-size: clamp(2rem, 4vw, 3rem);
      line-height: 1.08;
      letter-spacing: -.025em;
    }
    .utility-page p {
      max-width: 620px;
    }

    @media (max-width: 680px) {
      .topbar { min-height: 64px; }
      .brand { font-size: 1.3rem; }
      .brand-mark { width: 27px; height: 27px; }
      .home { padding-top: 10vh; }
      .lookup-control,
      .signin-plain {
        flex-direction: column;
        align-items: stretch;
      }
      .paper-window {
        padding: 8px 0 0;
      }
      .paper-grid {
        grid-template-columns: 1fr;
        gap: 20px;
      }
      .paper-meta {
        display: flex;
        align-items: baseline;
        gap: 14px;
        padding-top: 0;
      }
      .paper-id,
      .paper-venue,
      .paper-doi { margin: 0; }
      .paper-links { display: flex; gap: 12px; }
      .paper-source { max-width: none; }
      .paper-tabs {
        display: flex;
        width: 100%;
        gap: 18px;
        overflow-x: auto;
      }
      .paper-tabs a {
        flex: 0 0 auto;
        text-align: left;
      }
      .comment {
        margin-left: calc(min(var(--depth), 2) * 14px);
      }
      .comment-head span { display: none; }
      .composer-actions { align-items: flex-end; }
    }
  </style>
</head>
<body>${body}</body>
</html>`,
    {
      status,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Content-Security-Policy": "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; form-action 'self' https://orcid.org; frame-ancestors 'none'; base-uri 'none'",
      },
    },
  );
}

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value, null, 2), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function redirect(location: string, status = 302): Response {
  return new Response(null, { status, headers: { Location: location } });
}

function notFound(message: string): Response {
  return htmlPage(
    "Not found",
    `<main class="shell utility-page"><h1>Not found.</h1><p class="muted">${escapeHtml(message)}</p><p><a href="/">Return home</a></p></main>`,
    404,
  );
}

function escapeHtml(value: unknown): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(value: unknown): string {
  return escapeHtml(value);
}

function safeJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function formatDate(value: string): string {
  const date = new Date(value.endsWith("Z") || /[+-]\d\d:\d\d$/.test(value) ? value : `${value}Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function parseCookies(header: string): Map<string, string> {
  const cookies = new Map<string, string>();
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index < 0) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key) cookies.set(key, decodeURIComponent(value));
  }
  return cookies;
}

function sessionCookie(token: string, request: Request, maxAge: number): string {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

function randomToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function base64UrlEncode(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function decodeNextFromState(state: string): string {
  const separator = state.indexOf(":");
  if (separator < 0) return "/";
  try {
    const next = base64UrlDecode(state.slice(separator + 1));
    return next.startsWith("/") && !next.startsWith("//") ? next : "/";
  } catch {
    return "/";
  }
}

function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("Origin");
  if (!origin) return;
  if (origin !== new URL(request.url).origin) {
    throw new Error("Cross-origin form submission rejected");
  }
}
