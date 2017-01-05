package Google::GeoCoder::Smart;

require Exporter;

use strict;
use LWP::Simple qw(!head);
use JSON;

our @ISA = qw(Exporter);

our @EXPORT = qw(geocode parse);

our $VERSION = 2.0.0;

=head1 NAME

Smart - Google Maps Api HTTP geocoder

=head1 SYNOPSIS

	use Google::GeoCoder::Smart;
	 
	$geo = Google::GeoCoder::Smart->new();

	my $response = $geo->geocode_addr({'address'=>'foo'});

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


=head1 DESCRIPTION

This module provides a simple interface to the Google Maps geocoding API. 

It is compatible with the google maps http geocoder as of 2017-01-04

This module only depends on LWP::Simple and JSON. 

Version 2 adds the geocode_addr function with a better return payload. the geocode function still has the same argument and return structure, but it's just a wrapper for geocode_addr now to keep backwards compatability.

#################################################

MAKE SURE TO READ GOOGLE's TERMS OF USE

they can be found at http://code.google.com/apis/maps/terms.html#section_10_12

#################################################

If you find any bugs, please let me know. 

=head1 METHODS

=head2 new

	$geo = Google::GeoCoder::Smart->new();

	$geo = Google::GeoCoder::Smart->new("key" => "<your api key here>", "host" => "<host here>", "http" => "<http or https>");

All input parameters are optional.

The "key" parameter is recommended, otherwise you will hit the daily cap.

The host paramater is only necessary if you use a different google host than googleapis.com, such as google.com.eu or something like that. 

=head2 geocode_addr

	my $response = $geo->geocode_addr({'address'=>'foo'});

	my $response = $geo->geocode_addr(
	{
		'address' => 'foo',
		'city' => 'bar',
		'state' => 'FB',
		'zip' => '86753-0900'
	});

This function returns a nested hash/array object formatted almost exactly like the JSON return from Google's api.

=head3 $response->{status}
Return Status.
	OK => good return
	connection => LWP connection failed
	OVER_QUERY_LIMIT => Over api query limit.
	ZERO_RESULTS => No matches found
	ERROR_GETTING_PAGE => LWP tried, but something else went wrong
	

=head3 $response->{results}
Array reference for each possible match. Multiple matches can be returned by Google if the address is not specific

=head3 $response->{rawJSON}
The raw JSON output. Useful for debugging and just visualizing the full object structure

=head2 geocode

	my ($num, $error, @results, $returntext) = $geo->geocode(

	"address" => "address *or street number and name* here", 

	"city" => "city here", 

	"state" => "state here", 

	"zip" => "zipcode here"

	);

***NOTE THIS FUNCTION IS DEPRICATED

This function brings back the number of results found for the address and 

the results in an array. This is the case because Google will sometimes return

many different results for one address.

It also returns the result text for debugging purposes.

The geocode method will work if you pass the whole address as the "address" tag.
	
However, it also supports breaking it down into parts.

It will return one of the following error messages if an error is encountered

	connection         #something went wrong with the download

	OVER_QUERY_LIMIT   #the google query limit has been exceeded. Try again 24 hours from when you started geocoding

	ZERO_RESULTS       #no results were found for the address entered

If no errors were encountered it returns the value "OK"

You can get the returned parameters easily through refferences. 

	$lat = $results[0]{geometry}{location}{lat};

	$lng = $results[0]{geometry}{location}{lng};

It is helpful to know the format of the json returns of the api. 

A good example can be found at http://www.googleapis.com/maps/apis/geocode/json?address=1600+Amphitheatre+Parkway+Mountain+View,+CA+94043&sensor=false

=head1 AUTHOR

TTG, ttg@cpan.org

=head1 COPYRIGHT AND LICENSE

Copyright (C) 2017 by TTG

This library is free software; you can redistribute it and/or modify

it under the same terms as Perl itself, either Perl version 5.10.0 or,

at your option, any later version of Perl 5 you may have available.


=cut

sub new {

	my ($self, %params) = @_;

	my $host = $params{host} || "maps.googleapis.com";

	my $http = $params{http} || "https";

	my $key = $params{key};

	bless {
		"key" => $key, 
		"host" => $host,
		"http" => $http
	};

}

sub geocode_addr {

	my ($self, $params) = @_;

	my $addr = $params->{'address'};
	my $city = $params->{'city'};
	my $state = $params->{'state'};
	my $zip = $params->{'zip'};

	if($city ne "") {
		$addr .= ",+$city";
	}
	if($state ne "") {
		$addr .= ",+$state";
	}
	if($zip ne "") {
		$addr .= "+$zip";
	}

	for($addr) {
		s/\n//g;
		s/\r//g;
		s/\s+/\+/g;
		s/\s/\+/g;
	}

	my $keyVar = "";
	if($self->{key}) {
		$keyVar = "&key=$self->{key}";
	}

	my $content = get("$self->{http}://$self->{host}/maps/api/geocode/json?address=$addr&sensor=false$keyVar");

	my $return = {};

	if(!defined $content) {
		$return->{status} = "connection";
		return $return;
	}
	if($content eq "") {
		$return->{status} = "ERROR_GETTING_PAGE";
		return $return;
	}

	my $results_json  = decode_json($content);

	$return = $results_json;
	$return->{rawJSON} = $content;

	return $return;

}

sub geocode {

	#Depricated Function Interface
	#It's only in here in case someone wrote code based on the old
	#return format cause I don't want to break their code

	my ($self, %params) = @_;

	my $addr = $params{'address'};
	my $city = $params{'city'};
	my $state = $params{'state'};
	my $zip = $params{'zip'};

	my $addrInfo = $self->geocode_addr({
		'address' => $addr,
		'city' => $city,
		'state' => $state,
		'zip' => $zip
	});

	my $length = @{$addrInfo->{results}};

	return $length,$addrInfo->{status},@{$addrInfo->{results}},$addrInfo->{rawJSON};

}

