<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TemplateMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $mailTitle;
    public string $mailMessage;

    public function __construct(string $title, string $message)
    {
        $this->mailTitle = $title;
        $this->mailMessage = $message;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->mailTitle,
        );
    }

    public function content(): Content
    {
        // Simple inline content definition
        return new Content(
            htmlString: "<h3>{$this->mailTitle}</h3><p>{$this->mailMessage}</p>",
        );
    }
}
