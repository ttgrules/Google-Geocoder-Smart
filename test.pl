use Google::GeoCoder::Smart;
 
$geo = Google::GeoCoder::Smart->new();

my $response = $geo->geocode_addr({'address' => '1600 Amphitheatre Parkway, Mountain View, CA'});

if($response->{status} ne "OK") {
	die "Error: $response->{status}\n";
}

my $numResults = @{$response->{results}};

if($numResults > 1) {
	warn "Multiple Matches Found\n";
}

my $bestMatch = $response->{results}->[0];

my $lat = $bestMatch->{geometry}{location}{lat};
my $lng = $bestMatch->{geometry}{location}{lng};

print "$lat\n$lng\n";
